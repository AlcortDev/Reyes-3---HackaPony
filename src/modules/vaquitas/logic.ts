// Funciones puras de vaquitas. Dueño: Jesús.
import type { EstadoCanasta } from "@/shared/types";

/** [RN-06, RN-08] Estado real de una vaquita al momento de consultarla. */
export function estadoEfectivo(estado: EstadoCanasta, cierraEn: Date, total: number, meta: number, ahora = new Date()): EstadoCanasta {
  if (estado !== "ABIERTA") return estado;
  if (total >= meta) return "COMPLETA";
  if (cierraEn.getTime() <= ahora.getTime()) return "CERRADA";
  return "ABIERTA";
}

export function porcentaje(total: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(100, Math.round((total / meta) * 100));
}

/** [RN-05] Cuánto se puede aportar todavía. */
export function faltantes(total: number, meta: number): number {
  return Math.max(0, meta - total);
}
