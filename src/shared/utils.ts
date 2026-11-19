const formatoMXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const formatoFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

/** "$1,234.50" [RNF-13] */
export function formatoMoneda(n: number): string {
  return formatoMXN.format(n);
}

/** "19 nov 2026, 10:30" [RNF-13] */
export function formatoFechaHora(d: Date | string): string {
  return formatoFecha.format(typeof d === "string" ? new Date(d) : d);
}

/** Escapa texto para meterlo en HTML (correos). */
export function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
