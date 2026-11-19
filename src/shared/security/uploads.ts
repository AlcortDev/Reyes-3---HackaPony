// [RNF-SEC-08] Validación de archivos subidos (OWASP File Upload Cheat Sheet).
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import type { Resultado } from "@/shared/types";

export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const MIME_IMAGEN = ["image/jpeg", "image/png", "image/webp"] as const;
export const MIME_DOCUMENTO = [...MIME_IMAGEN, "application/pdf"] as const;
export type MimePermitido = (typeof MIME_DOCUMENTO)[number];

/** Valida tamaño y tipo REAL (por los bytes, no por la extensión ni el MIME del navegador). */
export async function validarArchivo(
  archivo: FormDataEntryValue | null,
  tipos: readonly MimePermitido[],
): Promise<Resultado<{ buffer: Buffer; mime: MimePermitido }>> {
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Falta el archivo" };
  if (archivo.size > MAX_BYTES) return { ok: false, error: "El archivo pesa más de 5 MB" };

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const tipo = await fileTypeFromBuffer(buffer);
  if (!tipo || !(tipos as readonly string[]).includes(tipo.mime)) {
    return { ok: false, error: "Tipo de archivo no permitido" };
  }
  return { ok: true, data: { buffer, mime: tipo.mime as MimePermitido } };
}

/** Re-codifica imágenes: quita EXIF/GPS y neutraliza contenido escondido. Los PDF pasan igual. */
export async function limpiarArchivo(
  buffer: Buffer,
  mime: MimePermitido,
): Promise<{ buffer: Buffer; mime: MimePermitido }> {
  if (mime === "application/pdf") return { buffer, mime };
  const limpio = await sharp(buffer)
    .rotate() // aplica la orientación EXIF antes de descartarla
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer(); // sharp no copia metadatos salvo que se pida withMetadata()
  return { buffer: limpio, mime: "image/jpeg" };
}
