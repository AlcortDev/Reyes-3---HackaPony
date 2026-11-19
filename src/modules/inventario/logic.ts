// Funciones puras del inventario (sin BD ni React). Dueño: Alvaro.
import type { NivelStock } from "./types";

/** [RN-01] 🔴 stock ≤ mínimo · 🟡 stock ≤ 2×mínimo · 🟢 el resto */
export function nivelStock(stock: number, stockMinimo: number): NivelStock {
  if (stock <= stockMinimo) return "critico";
  if (stock <= 2 * stockMinimo) return "bajo";
  return "ok";
}

/**
 * Conteo físico ("tengo N en total"): el movimiento que deja el stock en `existencias`,
 * para que el historial siga cuadrando. null si no hay nada que corregir.
 */
export function movimientoParaAjuste(
  stockActual: number,
  existencias: number,
): { tipo: "ENTRADA" | "SALIDA"; cantidad: number } | null {
  const diferencia = existencias - stockActual;
  if (diferencia === 0) return null;
  return diferencia > 0 ? { tipo: "ENTRADA", cantidad: diferencia } : { tipo: "SALIDA", cantidad: -diferencia };
}

/** [RN-07] floor(stock / promedio diario de salidas de los últimos 7 días). null = sin datos. */
export function diasParaAgotarse(stock: number, salidasUltimos7Dias: number): number | null {
  const promedioDiario = salidasUltimos7Dias / 7;
  if (promedioDiario <= 0) return null;
  return Math.floor(stock / promedioDiario);
}
