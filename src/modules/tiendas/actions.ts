"use server";
// Registro de tienda con documentos. Dueño: Hiram (servidor).
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
  registrarEvento,
} from "@/shared/security";
import { guardarDocumento } from "@/shared/storage";
import { ok, fallo, type Resultado } from "@/shared/types";
import { registroSchema, CAMPOS_DOCUMENTO } from "./schemas";

const MENSAJE_GENERICO =
  "Si el correo está disponible, te enviamos un enlace para confirmarlo. Revisa tu bandeja de entrada.";

/**
 * [RF-VER-01…04] Un solo envío con cuenta + tienda + ubicación + 3 documentos.
 */
export async function registrarTienda(formData: FormData): Promise<Resultado<{ mensaje: string }>> {
  const { ip, userAgent } = await datosDelRequest();

  // 1. Limitar intentos por IP
  const permitido = await limitarIntentos(`registro:${ip}`, 5, 3600);
  if (!permitido) {
    return fallo("Demasiados intentos de registro. Intenta más tarde.");
  }

  // 2. Parsear y validar campos de texto
  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    // Excluir archivos del objeto para Zod
    if (!(value instanceof File)) {
      rawData[key] = value;
    }
  });

  const parsed = registroSchema.safeParse(rawData);
  if (!parsed.success) {
    return fallo(parsed.error.issues[0]?.message ?? "Datos inválidos en el formulario");
  }

  // 3. Validar y limpiar los 3 archivos obligatorios
  const archivoFachada = formData.get(CAMPOS_DOCUMENTO.FACHADA);
  const archivoComprobante = formData.get(CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO);
  const archivoIdentificacion = formData.get(CAMPOS_DOCUMENTO.IDENTIFICACION);

  const valFachada = await validarArchivo(archivoFachada, MIME_IMAGEN);
  if (!valFachada.ok) return fallo(`Foto de fachada: ${valFachada.error}`);

  const valComprobante = await validarArchivo(archivoComprobante, MIME_DOCUMENTO);
  if (!valComprobante.ok) return fallo(`Comprobante de domicilio: ${valComprobante.error}`);

  const valIdentificacion = await validarArchivo(archivoIdentificacion, MIME_DOCUMENTO);
  if (!valIdentificacion.ok) return fallo(`Identificación oficial: ${valIdentificacion.error}`);

  const limpiaFachada = await limpiarArchivo(valFachada.data.buffer, valFachada.data.mime);
  const limpiaComprobante = await limpiarArchivo(valComprobante.data.buffer, valComprobante.data.mime);
  const limpiaIdentificacion = await limpiarArchivo(valIdentificacion.data.buffer, valIdentificacion.data.mime);

  // 4. Crear cuenta en Better Auth
  let nuevoUsuario: { id: string };
  try {
    const signupRes = await auth.api.signUpEmail({
      body: {
        name: parsed.data.nombre,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    if (!signupRes?.user?.id) {
      // Si Better Auth no devolvió el usuario pero no arrojó excepción
      return ok({ mensaje: MENSAJE_GENERICO });
    }
    nuevoUsuario = signupRes.user;
  } catch (err: unknown) {
    // Si el correo ya existe o Better Auth arroja error de usuario existente, responder MENSAJE_GENERICO [RNF-SEC-06]
    console.warn("[registro] Error en signUpEmail (posible correo duplicado):", err);
    return ok({ mensaje: MENSAJE_GENERICO });
  }

  // 5. Crear Tienda y guardar documentos en transacción atómica con rollback de compensación
  let tiendaId: string;
  try {
    const resultadoTx = await db.$transaction(async (tx) => {
      const tienda = await tx.tienda.create({
        data: {
          usuarioId: nuevoUsuario.id,
          nombre: parsed.data.nombreTienda,
          encargado: parsed.data.nombre,
          telefono: parsed.data.telefono,
          direccion: parsed.data.direccion,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          estatusVerificacion: "PENDIENTE",
        },
        select: { id: true },
      });

      await guardarDocumento(tx, {
        tiendaId: tienda.id,
        tipo: "FACHADA",
        buffer: limpiaFachada.buffer,
        mime: limpiaFachada.mime,
      });

      await guardarDocumento(tx, {
        tiendaId: tienda.id,
        tipo: "COMPROBANTE_DOMICILIO",
        buffer: limpiaComprobante.buffer,
        mime: limpiaComprobante.mime,
      });

      await guardarDocumento(tx, {
        tiendaId: tienda.id,
        tipo: "IDENTIFICACION",
        buffer: limpiaIdentificacion.buffer,
        mime: limpiaIdentificacion.mime,
      });

      return tienda;
    });

    tiendaId = resultadoTx.id;
  } catch (error) {
    console.error("[registro] Error al crear tienda/documentos en BD. Compensando usuario...", error);
    // Compensación: eliminar usuario creado si la tienda o sus documentos no pudieron guardarse
    await db.user.delete({ where: { id: nuevoUsuario.id } }).catch(() => {});
    return fallo("Ocurrió un error al registrar los documentos de la tienda. Intenta nuevamente.");
  }

  // 6. Auditoría y respuesta genérica
  await registrarEvento("TIENDA_REGISTRADA", {
    exito: true,
    userId: nuevoUsuario.id,
    objetivo: tiendaId,
    ip,
    userAgent,
    detalle: { tienda: parsed.data.nombreTienda },
  });

  return ok({ mensaje: MENSAJE_GENERICO });
}

/** [RF-VER-07] Solo si la tienda del usuario en sesión está RECHAZADA → vuelve a PENDIENTE. */
export async function resubirDocumentos(formData: FormData): Promise<Resultado> {
  const sesion = await assertSession();
  const { ip, userAgent } = await datosDelRequest();

  // Rate limit para re-subida
  const permitido = await limitarIntentos(`resubir:${sesion.user.id}`, 5, 3600);
  if (!permitido) {
    return fallo("Demasiados intentos. Intenta más tarde.");
  }

  const tienda = await db.tienda.findUnique({
    where: { usuarioId: sesion.user.id },
  });
  if (!tienda) return fallo("No encontramos una tienda asociada a tu cuenta");
  if (tienda.estatusVerificacion !== "RECHAZADA") {
    return fallo("Solo se pueden re-subir documentos si la tienda está rechazada");
  }

  // Validar y limpiar los 3 archivos
  const archivoFachada = formData.get(CAMPOS_DOCUMENTO.FACHADA);
  const archivoComprobante = formData.get(CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO);
  const archivoIdentificacion = formData.get(CAMPOS_DOCUMENTO.IDENTIFICACION);

  const valFachada = await validarArchivo(archivoFachada, MIME_IMAGEN);
  if (!valFachada.ok) return fallo(`Foto de fachada: ${valFachada.error}`);

  const valComprobante = await validarArchivo(archivoComprobante, MIME_DOCUMENTO);
  if (!valComprobante.ok) return fallo(`Comprobante de domicilio: ${valComprobante.error}`);

  const valIdentificacion = await validarArchivo(archivoIdentificacion, MIME_DOCUMENTO);
  if (!valIdentificacion.ok) return fallo(`Identificación oficial: ${valIdentificacion.error}`);

  const limpiaFachada = await limpiarArchivo(valFachada.data.buffer, valFachada.data.mime);
  const limpiaComprobante = await limpiarArchivo(valComprobante.data.buffer, valComprobante.data.mime);
  const limpiaIdentificacion = await limpiarArchivo(valIdentificacion.data.buffer, valIdentificacion.data.mime);

  // Reemplazar documentos en transacción y pasar tienda a PENDIENTE
  await db.$transaction(async (tx) => {
    await tx.documentoTienda.deleteMany({
      where: { tiendaId: tienda.id },
    });

    await guardarDocumento(tx, {
      tiendaId: tienda.id,
      tipo: "FACHADA",
      buffer: limpiaFachada.buffer,
      mime: limpiaFachada.mime,
    });

    await guardarDocumento(tx, {
      tiendaId: tienda.id,
      tipo: "COMPROBANTE_DOMICILIO",
      buffer: limpiaComprobante.buffer,
      mime: limpiaComprobante.mime,
    });

    await guardarDocumento(tx, {
      tiendaId: tienda.id,
      tipo: "IDENTIFICACION",
      buffer: limpiaIdentificacion.buffer,
      mime: limpiaIdentificacion.mime,
    });

    await tx.tienda.update({
      where: { id: tienda.id },
      data: {
        estatusVerificacion: "PENDIENTE",
        motivoRechazo: null,
        enviadaEn: new Date(),
        revisadaEn: null,
        revisadaPorId: null,
      },
    });
  });

  await registrarEvento("DOCS_RESUBIDOS", {
    exito: true,
    userId: sesion.user.id,
    objetivo: tienda.id,
    ip,
    userAgent,
  });

  return ok(undefined);
}
