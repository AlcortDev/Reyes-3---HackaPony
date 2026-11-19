// [RNF-SEC-09] Cifrado de documentos con AES-256-GCM + SHA-256 de integridad.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Uint8Array<ArrayBuffer> es el tipo que Prisma 6 usa para columnas Bytes.
export interface DatosCifrados {
  contenido: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  authTag: Uint8Array<ArrayBuffer>;
}

function llave(): Buffer {
  const base64 = process.env.DOCS_ENCRYPTION_KEY;
  if (!base64) throw new Error("Falta DOCS_ENCRYPTION_KEY en .env (openssl rand -base64 32)");
  const k = Buffer.from(base64, "base64");
  if (k.length !== 32) throw new Error("DOCS_ENCRYPTION_KEY debe ser de 32 bytes en base64");
  return k;
}

export function cifrar(datos: Buffer): DatosCifrados {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", llave(), iv);
  const contenido = Buffer.concat([cipher.update(datos), cipher.final()]);
  return { contenido: new Uint8Array(contenido), iv: new Uint8Array(iv), authTag: new Uint8Array(cipher.getAuthTag()) };
}

/** Lanza error si el contenido fue alterado (GCM valida el authTag). */
export function descifrar(c: { contenido: Uint8Array; iv: Uint8Array; authTag: Uint8Array }): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", llave(), Buffer.from(c.iv));
  decipher.setAuthTag(Buffer.from(c.authTag));
  return Buffer.concat([decipher.update(Buffer.from(c.contenido)), decipher.final()]);
}

export function sha256(datos: Uint8Array): string {
  return createHash("sha256").update(datos).digest("hex");
}
