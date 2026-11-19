// Lecturas del inventario. Dueño: Alvaro.
// Quien llama ya validó la sesión (requireTiendaAprobada) y pasa el tiendaId DE LA SESIÓN.
import type { DetalleInventarioDTO, ItemInventarioDTO } from "./types";
import { INVENTARIO_MOCK } from "./mocks";

/** [RF-INV-01, RF-INV-05] */
export async function getInventarioPorTienda(tiendaId: string): Promise<ItemInventarioDTO[]> {
  // TODO(Alvaro) [RF-INV-01] db.inventario.findMany({ where: { tiendaId }, include: { producto: true } })
  //   + nivelStock() de logic.ts, ordenado con los 🔴 primero [RF-INV-05]
  void tiendaId;
  return INVENTARIO_MOCK;
}

/** [RF-INV-06, RF-INV-07] Debe verificar que el inventario pertenezca a tiendaId. */
export async function getDetalleInventario(inventarioId: string, tiendaId: string): Promise<DetalleInventarioDTO | null> {
  // TODO(Alvaro) [RF-INV-06] findFirst({ where: { id: inventarioId, tiendaId } }) + últimos movimientos
  //   + diasParaAgotarse() con las SALIDAS de 7 días [RN-07]
  void tiendaId;
  const item = INVENTARIO_MOCK.find((i) => i.id === inventarioId);
  return item ? { ...item, movimientos: [], diasParaAgotarse: null } : null;
}

/** [RF-INV-04] Contrato usado por vaquitas. */
export async function getProductosBajoStock(tiendaId: string): Promise<ItemInventarioDTO[]> {
  const items = await getInventarioPorTienda(tiendaId);
  return items.filter((i) => i.nivel === "critico");
}
