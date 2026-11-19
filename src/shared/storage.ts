// [RNF-SEC-09 · ADR-08] Documentos de verificación cifrados dentro de PostgreSQL.
// Todo acceso a documentos pasa por aquí, para poder migrar a almacenamiento de objetos sin tocar módulos.
import type { Prisma, TipoDocumento } from "@prisma/client";
import { db } from "@/shared/db";
import { cifrar, descifrar, sha256 } from "@/shared/security/crypto";

type ClienteBD = Prisma.TransactionClient | typeof db;

export async function guardarDocumento(
  cliente: ClienteBD,
  input: { tiendaId: string; tipo: TipoDocumento; buffer: Buffer; mime: string },
): Promise<{ id: string }> {
  const { contenido, iv, authTag } = cifrar(input.buffer);
  return cliente.documentoTienda.create({
    data: {
      tiendaId: input.tiendaId,
      tipo: input.tipo,
      mimeType: input.mime,
      tamano: input.buffer.length,
      sha256: sha256(input.buffer),
      iv: new Uint8Array(iv),
      authTag: new Uint8Array(authTag),
      contenido: new Uint8Array(contenido),
    },
    select: { id: true },
  });
}

/** Descifra y verifica integridad. Quien llama DEBE haber revisado permisos antes. */
export async function leerDocumento(id: string) {
  const doc = await db.documentoTienda.findUnique({
    where: { id },
    select: { id: true, tiendaId: true, tipo: true, mimeType: true, sha256: true, iv: true, authTag: true, contenido: true },
  });
  if (!doc) return null;

  const buffer = descifrar(doc);
  if (sha256(buffer) !== doc.sha256) throw new Error("El documento no pasó la verificación de integridad");
  return { id: doc.id, tiendaId: doc.tiendaId, tipo: doc.tipo, mimeType: doc.mimeType, buffer };
}

/** Lista documentos SIN cargar el contenido. */
export async function listarDocumentos(tiendaId: string) {
  return db.documentoTienda.findMany({
    where: { tiendaId },
    select: { id: true, tipo: true, mimeType: true, tamano: true, creadoEn: true },
    orderBy: { creadoEn: "desc" },
  });
}
