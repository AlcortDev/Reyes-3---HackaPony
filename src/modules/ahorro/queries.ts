// Lecturas de ahorro. Dueño: Jesús.
import type { EstadoCanasta } from "@/shared/types";
import { getAportacionesPorTienda } from "@/modules/vaquitas";
import { calcularAhorro } from "./logic";

export interface ResumenAhorro {
  ahorrado: number;
  potencial: number;
  detalle: Array<{ vaquitaId: string; producto: string; cantidad: number; ahorro: number; estado: EstadoCanasta }>;
}

/** [RF-AHO-01, RF-AHO-02] Ahorrado = vaquitas COMPLETAS; potencial = ABIERTAS. */
export async function getResumenAhorroTienda(tiendaId: string): Promise<ResumenAhorro> {
  const aportaciones = await getAportacionesPorTienda(tiendaId);
  const detalle = aportaciones.map((a) => ({
    vaquitaId: a.vaquitaId,
    producto: a.producto,
    cantidad: a.cantidad,
    ahorro: calcularAhorro(a.precioMenudeo, a.precioMayoreo, a.cantidad),
    estado: a.estado,
  }));
  const suma = (estado: EstadoCanasta) =>
    detalle.filter((d) => d.estado === estado).reduce((t, d) => t + d.ahorro, 0);
  return { ahorrado: suma("COMPLETA"), potencial: suma("ABIERTA"), detalle };
}

/** [RF-AHO-03 · COULD] */
export async function getResumenAhorroColonia(): Promise<{ ahorrado: number; potencial: number }> {
  // TODO(Jesús) [RF-AHO-03] sumar todas las aportaciones de la colonia
  return { ahorrado: 0, potencial: 0 };
}
