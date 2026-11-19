// 🚪 API pública del módulo inventario (Alvaro). Otros módulos SOLO importan desde aquí.
export type { NivelStock, ItemInventarioDTO, DetalleInventarioDTO, MovimientoDTO } from "./types";
export { nivelStock, diasParaAgotarse } from "./logic";
export { getInventarioPorTienda, getDetalleInventario, getProductosBajoStock } from "./queries";
export { registrarMovimiento } from "./actions";
export { InventarioLista } from "./components/InventarioLista";
