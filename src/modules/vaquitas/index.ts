// 🚪 API pública del módulo vaquitas (Jesús). Otros módulos SOLO importan desde aquí.
export type { VaquitaDTO, VaquitaDetalleDTO, AportacionDTO, AportacionPorTiendaDTO } from "./types";
export { estadoEfectivo, porcentaje, faltantes } from "./logic";
export { listarVaquitas, getVaquita, getVaquitaAbiertaPorProducto, getAportacionesPorTienda } from "./queries";
export { aportarAVaquita, crearVaquita } from "./actions";
export { VaquitasLista, BarraVaquita } from "./components/VaquitasLista";
