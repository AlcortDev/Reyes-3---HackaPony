// Funciones puras de vaquitas. Dueño: Jesús.
import type { EstadoCanasta } from "@/shared/types";
import type { AportacionPorTiendaDTO } from "./types";

/** [RN-06, RN-08] Estado real de una vaquita al momento de consultarla. */
export function estadoEfectivo(
  estado: EstadoCanasta,
  cierraEn: Date,
  total: number,
  meta: number,
  ahora = new Date(),
): EstadoCanasta {
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

/** [RN-10] Una tienda puede aportar varias veces a la misma vaquita; en la lista se muestran sumadas por tienda. */
export function agruparAportacionesPorTienda(
  aportaciones: ReadonlyArray<{ tiendaId: string; tienda: string; cantidad: number }>,
): AportacionPorTiendaDTO[] {
  const mapa = new Map<string, AportacionPorTiendaDTO>();
  for (const a of aportaciones) {
    const existente = mapa.get(a.tiendaId);
    if (existente) {
      existente.cantidad += a.cantidad;
    } else {
      mapa.set(a.tiendaId, { tiendaId: a.tiendaId, tienda: a.tienda, cantidad: a.cantidad });
    }
  }
  return Array.from(mapa.values()).sort((x, y) => y.cantidad - x.cantidad);
}

/** [RF-VAQ-08] Cuenta regresiva amigable para el tendero. */
export function tiempoRestante(
  cierraEn: Date | string,
  ahora = new Date(),
): { vencida: boolean; texto: string; urgente: boolean } {
  const destino = typeof cierraEn === "string" ? new Date(cierraEn) : cierraEn;
  const diffMs = destino.getTime() - ahora.getTime();
  if (diffMs <= 0) {
    return { vencida: true, texto: "Plazo vencido", urgente: false };
  }
  const totalSeg = Math.floor(diffMs / 1000);
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;

  const urgente = diffMs <= 6 * 3600 * 1000;
  if (dias > 0) {
    return { vencida: false, texto: `${dias}d ${horas}h`, urgente };
  }
  if (horas > 0) {
    return { vencida: false, texto: `${horas}h ${minutos}m`, urgente };
  }
  return { vencida: false, texto: `${minutos}m ${segundos}s`, urgente: true };
}

/** [RF-VAQ-09] Mensaje prellenado para invitar tenderos vecinos por WhatsApp. */
export function construirMensajeWhatsApp(
  vaquita: {
    producto: string;
    proveedor: string;
    totalAportado: number;
    metaUnidades: number;
    faltan: number;
    precioMenudeo: number;
    precioMayoreo: number;
  },
  url: string,
): string {
  const ahorroUnit = Math.max(0, vaquita.precioMenudeo - vaquita.precioMayoreo).toFixed(2);
  if (vaquita.faltan <= 0) {
    return `🎉 ¡Vecinos! Ya completamos la vaquita de ${vaquita.producto} (${vaquita.metaUnidades} unidades con ${vaquita.proveedor}) a precio de mayoreo ($${vaquita.precioMayoreo.toFixed(2)}, ahorrando $${ahorroUnit} por unidad). Revísala aquí: ${url}`;
  }
  return `🐄 ¡Vecinos de la colonia! Hagamos la vaquita de ${vaquita.producto} con ${vaquita.proveedor}. Llevamos ${vaquita.totalAportado}/${vaquita.metaUnidades} (solo faltan ${vaquita.faltan}) para bajar el precio de $${vaquita.precioMenudeo.toFixed(2)} a $${vaquita.precioMayoreo.toFixed(2)} (ahorras $${ahorroUnit}/u). ¡Éntrale aquí! ${url}`;
}
