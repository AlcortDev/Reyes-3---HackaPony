/** Una confirmación perdida exige consultar el stock antes de repetir la acción. */
export const MOVIMIENTO_SIN_CONFIRMAR = "No pudimos confirmar el movimiento. Actualiza el inventario antes de volver a intentarlo.";

/** Otra venta cambió el stock entre leerlo y guardar el conteo. */
export const STOCK_CAMBIO = "Alguien registró otro movimiento al mismo tiempo. Revisa el número y vuelve a guardar el conteo.";
