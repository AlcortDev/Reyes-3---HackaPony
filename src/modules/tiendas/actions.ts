"use server";
// Registro de cuenta y verificación de tienda (en dos pasos). Dueño: Hiram (servidor).
//   1. registrarCuenta:      nombre, correo y contraseña → correo de verificación.
//   2. solicitarVerificacion: ya con sesión → datos de la tienda, ubicación y 3 documentos → PENDIENTE.
import { auth } from "@/shared/auth";
import { db } from "@/shared/db";
import {
  assertSession,
  datosDelRequest,
  limitarIntentos,
  validarArchivo,
  limpiarArchivo,
  MIME_IMAGEN,
  MIME_DOCUMENTO,
  NoAutorizadoError,
  registrarEvento,
} from "@/shared/security";
import { guardarDocumento } from "@/shared/storage";
import { ok, fallo, type Resultado } from "@/shared/types";
import { cuentaSchema, verificacionSchema, CAMPOS_DOCUMENTO } from "./schemas";

const MENSAJE_GENERICO =
  "Si el correo está disponible, te enviamos un enlace para confirmarlo. Revisa tu bandeja de entrada.";

/**
 * [RNF-SEC-04] Límite de registros. Sin un proxy de confianza no conocemos la IP real (todas llegan como
 * "desconocida"), y una sola clave por IP dejaba registrarse a solo 5 personas por hora EN TOTAL.
 * Entonces: por IP cuando se conoce; si no, por correo + un tope global amplio.
 */
async function permitirRegistro(ip: string, email: string): Promise<boolean> {
  if (ip !== "desconocida") return limitarIntentos(`registro:ip:${ip}`, 10, 3600);
  const porCorreo = await limitarIntentos(`registro:correo:${email}`, 5, 3600);
  const global = await limitarIntentos("registro:global", 100, 3600);
  return porCorreo && global;
}

/** [RF-AUT-02 · RF-VER-01] Paso 1: crear la cuenta. Siempre responde lo mismo (no revela si el correo existe). */
export async function registrarCuenta(formData: FormData): Promise<Resultado<{ mensaje: string }>> {
  const { ip, userAgent } = await datosDelRequest();

  const parsed = cuentaSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Revisa tus datos");
  }

  if (!(await permitirRegistro(ip, parsed.data.email))) {
    return fallo("Demasiados intentos de registro. Intenta más tarde.");
  }

  try {
    const res = await auth.api.signUpEmail({
      body: { name: parsed.data.nombre, email: parsed.data.email, password: parsed.data.password },
    });
    if (res?.user?.id) {
      await registrarEvento("SIGNUP", { exito: true, userId: res.user.id, ip, userAgent });
    }
  } catch (err: unknown) {
    // Correo ya registrado u otro rechazo de Better Auth: misma respuesta [RNF-SEC-06]
    console.warn("[registro] signUpEmail rechazado (posible correo duplicado)");
    void err;
  }
  return ok({ mensaje: MENSAJE_GENERICO });
}

type DocumentosLimpios = Record<keyof typeof CAMPOS_DOCUMENTO, { buffer: Buffer; mime: string }>;

/** [RNF-SEC-08] Valida por bytes reales y limpia (EXIF/GPS) los 3 documentos. */
async function validarDocumentos(formData: FormData): Promise<Resultado<DocumentosLimpios>> {
  const fachada = await validarArchivo(formData.get(CAMPOS_DOCUMENTO.FACHADA), MIME_IMAGEN);
  if (!fachada.ok) return fallo(`Foto de fachada: ${fachada.error}`);
  const comprobante = await validarArchivo(formData.get(CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO), MIME_DOCUMENTO);
  if (!comprobante.ok) return fallo(`Comprobante de domicilio: ${comprobante.error}`);
  const identificacion = await validarArchivo(formData.get(CAMPOS_DOCUMENTO.IDENTIFICACION), MIME_DOCUMENTO);
  if (!identificacion.ok) return fallo(`Identificación oficial: ${identificacion.error}`);

  return ok({
    FACHADA: await limpiarArchivo(fachada.data.buffer, fachada.data.mime),
    COMPROBANTE_DOMICILIO: await limpiarArchivo(comprobante.data.buffer, comprobante.data.mime),
    IDENTIFICACION: await limpiarArchivo(identificacion.data.buffer, identificacion.data.mime),
  });
}

type Sesion = Awaited<ReturnType<typeof assertSession>>;

async function sesionDeTendero(): Promise<{ ok: true; sesion: Sesion } | { ok: false; error: string }> {
  try {
    const sesion = await assertSession();
    if (sesion.user.role === "ADMIN") return { ok: false, error: "La cuenta de administrador no registra tiendas." };
    return { ok: true, sesion };
  } catch (e) {
    if (e instanceof NoAutorizadoError) return { ok: false, error: e.message };
    throw e;
  }
}

/**
 * [RF-VER-01…04] Paso 2 (con sesión): datos de la tienda + ubicación + 3 documentos → tienda PENDIENTE.
 * El encargado es el nombre de la cuenta. Una tienda por usuario [RN-13].
 */
export async function solicitarVerificacion(formData: FormData): Promise<Resultado> {
  const quien = await sesionDeTendero();
  if (!quien.ok) return fallo(quien.error);
  const { sesion } = quien;
  const { ip, userAgent } = await datosDelRequest();

  if (!(await limitarIntentos(`verificacion:${sesion.user.id}`, 10, 3600))) {
    return fallo("Demasiados intentos. Intenta más tarde.");
  }

  const yaTiene = await db.tienda.findUnique({ where: { usuarioId: sesion.user.id }, select: { id: true } });
  if (yaTiene) return fallo("Tu tienda ya fue enviada a revisión. Revisa su estatus en tu perfil.");

  const parsed = verificacionSchema.safeParse({
    nombreTienda: formData.get("nombreTienda"),
    direccion: formData.get("direccion"),
    telefono: formData.get("telefono"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    aceptaPrivacidad: formData.get("aceptaPrivacidad"),
  });
  if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? "Revisa los datos de tu tienda");

  const docs = await validarDocumentos(formData);
  if (!docs.ok) return docs;

  let tiendaId: string;
  try {
    tiendaId = await db.$transaction(async (tx) => {
      const tienda = await tx.tienda.create({
        data: {
          usuarioId: sesion.user.id,
          nombre: parsed.data.nombreTienda,
          encargado: sesion.user.name,
          telefono: parsed.data.telefono,
          direccion: parsed.data.direccion,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          estatusVerificacion: "PENDIENTE",
        },
        select: { id: true },
      });
      for (const tipo of ["FACHADA", "COMPROBANTE_DOMICILIO", "IDENTIFICACION"] as const) {
        await guardarDocumento(tx, { tiendaId: tienda.id, tipo, buffer: docs.data[tipo].buffer, mime: docs.data[tipo].mime });
      }
      return tienda.id;
    });
  } catch {
    // Choque de usuarioId único (doble envío) o fallo al guardar: no queda nada a medias
    return fallo("No pudimos guardar tu solicitud. Revisa tu perfil e intenta de nuevo.");
  }

  await registrarEvento("TIENDA_REGISTRADA", {
    exito: true,
    userId: sesion.user.id,
    objetivo: tiendaId,
    ip,
    userAgent,
    detalle: { tienda: parsed.data.nombreTienda },
  });
  return ok(undefined);
}

/** [RF-VER-07] Solo si la tienda del usuario en sesión está RECHAZADA → vuelve a PENDIENTE. */
export async function resubirDocumentos(formData: FormData): Promise<Resultado> {
  const quien = await sesionDeTendero();
  if (!quien.ok) return fallo(quien.error);
  const { sesion } = quien;
  const { ip, userAgent } = await datosDelRequest();

  if (!(await limitarIntentos(`resubir:${sesion.user.id}`, 5, 3600))) {
    return fallo("Demasiados intentos. Intenta más tarde.");
  }

  const tienda = await db.tienda.findUnique({ where: { usuarioId: sesion.user.id } });
  if (!tienda) return fallo("No encontramos una tienda asociada a tu cuenta");
  if (tienda.estatusVerificacion !== "RECHAZADA") {
    return fallo("Solo se pueden re-subir documentos si la tienda está rechazada");
  }

  const docs = await validarDocumentos(formData);
  if (!docs.ok) return docs;

  // Reemplazar documentos en transacción y pasar tienda a PENDIENTE
  await db.$transaction(async (tx) => {
    await tx.documentoTienda.deleteMany({ where: { tiendaId: tienda.id } });
    for (const tipo of ["FACHADA", "COMPROBANTE_DOMICILIO", "IDENTIFICACION"] as const) {
      await guardarDocumento(tx, { tiendaId: tienda.id, tipo, buffer: docs.data[tipo].buffer, mime: docs.data[tipo].mime });
    }
    await tx.tienda.update({
      where: { id: tienda.id },
      data: { estatusVerificacion: "PENDIENTE", motivoRechazo: null, enviadaEn: new Date(), revisadaEn: null, revisadaPorId: null },
    });
  });

  await registrarEvento("DOCS_RESUBIDOS", { exito: true, userId: sesion.user.id, objetivo: tienda.id, ip, userAgent });
  return ok(undefined);
}
