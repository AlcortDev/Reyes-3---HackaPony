// Lecturas de vaquitas. Dueño: Jesús.
import type { EstadoCanasta } from "@/shared/types";
import type { AportacionDTO, VaquitaDetalleDTO, VaquitaDTO } from "./types";
import { VAQUITAS_MOCK } from "./mocks";

/** [RF-VAQ-01] */
export async function listarVaquitas(filtro?: { estado?: EstadoCanasta }): Promise<VaquitaDTO[]> {
  // TODO(Jesús) [RF-VAQ-01] db.canasta.findMany + suma de aportaciones + estadoEfectivo() de logic.ts
  return VAQUITAS_MOCK.filter((v) => !filtro?.estado || v.estado === filtro.estado);
}

/** [RF-VAQ-03, RF-VAQ-05] Mismo shape que GET /api/canastas/[id]. */
export async function getVaquita(canastaId: string): Promise<VaquitaDetalleDTO | null> {
  // TODO(Jesús) [RF-VAQ-03] aportaciones agrupadas por tienda [RN-10]
  return VAQUITAS_MOCK.find((v) => v.id === canastaId) ?? null;
}

/** [RN-12] Contrato usado por inventario (alerta → vaquita). */
export async function getVaquitaAbiertaPorProducto(productoId: string): Promise<VaquitaDTO | null> {
  // TODO(Jesús) findFirst({ where: { productoId, estado: "ABIERTA" } })
  return VAQUITAS_MOCK.find((v) => v.productoId === productoId && v.estado === "ABIERTA") ?? null;
}

/** Contrato usado por ahorro. */
export async function getAportacionesPorTienda(tiendaId: string): Promise<AportacionDTO[]> {
  // TODO(Jesús) db.aportacion.findMany({ where: { tiendaId }, include: { canasta: { include: { producto: true } } } })
  void tiendaId;
  return [];
}
