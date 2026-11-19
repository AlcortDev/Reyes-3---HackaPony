// Lecturas del panel de admin. Dueño: Hiram. Quien llama ya pasó por requireAdmin().
import { db } from "@/shared/db";
import { listarDocumentos } from "@/shared/storage";
import type { EstatusVerificacion } from "@/shared/types";

/** [RF-VER-06] Sin cargar el contenido de documentos. */
export async function listarTiendasPorEstatus(estatus: EstatusVerificacion) {
  return db.tienda.findMany({
    where: { estatusVerificacion: estatus },
    select: {
      id: true,
      nombre: true,
      encargado: true,
      direccion: true,
      enviadaEn: true,
      usuario: { select: { email: true } },
    },
    orderBy: { enviadaEn: "asc" },
  });
}

export async function getTiendaParaRevision(tiendaId: string) {
  const tienda = await db.tienda.findUnique({
    where: { id: tiendaId },
    include: { usuario: { select: { name: true, email: true, emailVerified: true } } },
  });
  if (!tienda) return null;
  return { ...tienda, documentos: await listarDocumentos(tienda.id) };
}

export type SolicitudDTO = Awaited<ReturnType<typeof listarTiendasPorEstatus>>[number];
export type RevisionDTO = NonNullable<Awaited<ReturnType<typeof getTiendaParaRevision>>>;
