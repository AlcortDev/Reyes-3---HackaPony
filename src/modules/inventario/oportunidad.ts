import type { VaquitaDTO } from "@/modules/vaquitas";

/** [RF-INV-08] Validación defensiva del contrato entre módulos. */
export function vaquitaVigente(vaquita: VaquitaDTO | null, productoId: string, ahora = new Date()): VaquitaDTO | null {
  if (!vaquita || vaquita.productoId !== productoId || vaquita.estado !== "ABIERTA"
    || !(new Date(vaquita.cierraEn).getTime() > ahora.getTime())
    || vaquita.totalAportado >= vaquita.metaUnidades || vaquita.faltan <= 0
    || vaquita.precioMayoreo >= vaquita.precioMenudeo) return null;
  return vaquita;
}
