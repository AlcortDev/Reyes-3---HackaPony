// Lecturas de ahorro. Dueño: Jesús.
import { getAportacionesPorTienda, listarVaquitas } from "@/modules/vaquitas";
import type { EstadoCanasta } from "@/shared/types";
import { calcularAhorro } from "./logic";

export interface DetalleAhorroVaquita {
  vaquitaId: string;
  producto: string;
  cantidad: number;
  precioMenudeo: number;
  precioMayoreo: number;
  ahorro: number;
  estado: EstadoCanasta;
}

export interface ResumenAhorro {
  ahorrado: number;
  potencial: number;
  detalle: DetalleAhorroVaquita[];
}

/** [RF-AHO-01, RF-AHO-02] Ahorrado = vaquitas COMPLETAS; potencial = ABIERTAS. */
export async function getResumenAhorroTienda(tiendaId: string): Promise<ResumenAhorro> {
  const aportaciones = await getAportacionesPorTienda(tiendaId);
  const detalle: DetalleAhorroVaquita[] = aportaciones.map((a) => ({
    vaquitaId: a.vaquitaId,
    producto: a.producto,
    cantidad: a.cantidad,
    precioMenudeo: a.precioMenudeo,
    precioMayoreo: a.precioMayoreo,
    ahorro: calcularAhorro(a.precioMenudeo, a.precioMayoreo, a.cantidad),
    estado: a.estado,
  }));

  const suma = (estado: EstadoCanasta) =>
    Math.round(
      detalle
        .filter((d) => d.estado === estado)
        .reduce((t, d) => t + d.ahorro, 0) * 100,
    ) / 100;

  return {
    ahorrado: suma("COMPLETA"),
    potencial: suma("ABIERTA"),
    detalle,
  };
}

/** [RF-AHO-03 · COULD] Ahorro total de la colonia sumando todas las tiendas. */
export async function getResumenAhorroColonia(): Promise<{ ahorrado: number; potencial: number }> {
  const vaquitas = await listarVaquitas();
  let ahorrado = 0;
  let potencial = 0;

  for (const v of vaquitas) {
    const ahorroVaquita = calcularAhorro(v.precioMenudeo, v.precioMayoreo, v.totalAportado);
    if (v.estado === "COMPLETA") {
      ahorrado = Math.round((ahorrado + ahorroVaquita) * 100) / 100;
    } else if (v.estado === "ABIERTA") {
      potencial = Math.round((potencial + ahorroVaquita) * 100) / 100;
    }
  }

  return { ahorrado, potencial };
}
