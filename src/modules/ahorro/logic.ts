// Funciones puras de ahorro. Dueño: Jesús. Sin dependencias (lo usa también vaquitas).

/** [RN-09] (menudeo − mayoreo) × cantidad, redondeado a centavos. */
export function calcularAhorro(precioMenudeo: number, precioMayoreo: number, cantidad: number): number {
  const ahorro = (precioMenudeo - precioMayoreo) * cantidad;
  return Math.max(0, Math.round(ahorro * 100) / 100);
}
