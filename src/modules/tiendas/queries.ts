// Lecturas de tiendas. Dueño: Hiram.
import { db } from "@/shared/db";
import { getSesion } from "@/shared/security";
import type { TiendaDTO } from "@/shared/types";
import { listarDocumentos } from "@/shared/storage";

/** Tienda del usuario en sesión con su estatus (para /perfil). Cualquier estatus. */
export async function getMiTienda() {
  const sesion = await getSesion();
  if (!sesion) return null;
  const tienda = await db.tienda.findUnique({ where: { usuarioId: sesion.user.id } });
  if (!tienda) return null;
  const documentos = await listarDocumentos(tienda.id);
  return { ...tienda, documentos };
}

export type MiTiendaDTO = NonNullable<Awaited<ReturnType<typeof getMiTienda>>>;

/** Tienda APROBADA de la sesión (para encabezados y módulos). */
export async function getTiendaActual(): Promise<TiendaDTO | null> {
  const sesion = await getSesion();
  if (!sesion) return null;
  const tienda = await db.tienda.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { id: true, nombre: true, encargado: true, direccion: true, lat: true, lng: true, estatusVerificacion: true },
  });
  return tienda?.estatusVerificacion === "APROBADA" ? tienda : null;
}
