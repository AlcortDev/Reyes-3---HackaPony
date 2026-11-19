// 🚪 API pública del módulo inventario (Alvaro). Otros módulos SOLO importan desde aquí.
export type { NivelStock, ItemInventarioDTO, DetalleInventarioDTO, MovimientoDTO, ProductoParaAgregarDTO } from "./types";
export { nivelStock, diasParaAgotarse, movimientoParaAjuste } from "./logic";
export { getInventarioPorTienda, getDetalleInventario, getProductosBajoStock, getProductosParaAgregar } from "./queries";
export { registrarMovimiento, ajustarExistencias, agregarProductoAlInventario } from "./actions";
export { altaInventarioSchema, type AltaInventarioInput } from "./alta";
export { InventarioLista } from "./components/InventarioLista";
export { InventarioDetalle } from "./components/InventarioDetalle";
