"use server";
// Registro de tienda con documentos. Dueño: Hiram (servidor).
import type { Resultado } from "@/shared/types";

const MENSAJE_GENERICO =
  "Si el correo está disponible, te enviamos un enlace para confirmarlo. Revisa tu bandeja de entrada.";

/**
 * [RF-VER-01…04] Un solo envío con cuenta + tienda + ubicación + 3 documentos.
 *
 * TODO(Hiram) — en este orden:
 *   1. limitarIntentos(`registro:${ip}`, 5, 3600)                       [RNF-SEC-04]
 *   2. registroSchema.safeParse(Object.fromEntries(formData))           [RNF-SEC-03]
 *   3. validarArchivo() de los 3 campos de CAMPOS_DOCUMENTO:
 *        fachada → MIME_IMAGEN · comprobante e identificación → MIME_DOCUMENTO   [RNF-SEC-08]
 *      y limpiarArchivo() a cada uno. Si algo falla → error y NO se crea nada.
 *   4. auth.api.signUpEmail({ body: { name, email, password } })        (manda el correo de verificación)
 *      Si el correo ya existe → responder MENSAJE_GENERICO igual         [RNF-SEC-06]
 *   5. db.$transaction: crear Tienda PENDIENTE + guardarDocumento() ×3  [RN-17]
 *      Si falla → borrar el User recién creado (compensación)           [RF-VER-04]
 *   6. registrarEvento("TIENDA_REGISTRADA") y responder MENSAJE_GENERICO
 */
export async function registrarTienda(formData: FormData): Promise<Resultado<{ mensaje: string }>> {
  void formData;
  void MENSAJE_GENERICO;
  return { ok: false, error: "Registro por implementar (Hiram)" };
}

/** [RF-VER-07] Solo si la tienda del usuario en sesión está RECHAZADA → vuelve a PENDIENTE. */
export async function resubirDocumentos(formData: FormData): Promise<Resultado> {
  // TODO(Hiram) assertSession → tienda RECHAZADA → validar/limpiar archivos → reemplazar documentos → PENDIENTE
  //   → registrarEvento("DOCS_RESUBIDOS")
  void formData;
  return { ok: false, error: "Por implementar (Hiram)" };
}
