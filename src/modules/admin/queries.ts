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

/** Catálogo con precios, para que el admin fije el precio de mayoreo [RN-11]. */
export async function listarCatalogo() {
  return db.producto.findMany({
    select: { id: true, nombre: true, categoria: true, unidad: true, precioMenudeo: true, precioMayoreo: true, codigoBarras: true },
    orderBy: [{ precioMayoreo: { sort: "asc", nulls: "first" } }, { nombre: "asc" }],
  });
}

export type ProductoCatalogoAdminDTO = Awaited<ReturnType<typeof listarCatalogo>>[number];
