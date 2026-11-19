// 🚪 API pública del módulo vaquitas (Jesús). Otros módulos SOLO importan desde aquí.
export type {
  VaquitaDTO,
  VaquitaDetalleDTO,
  AportacionDTO,
  AportacionPorTiendaDTO,
  ProductoCatalogoDTO,
} from "./types";
export {
  estadoEfectivo,
  porcentaje,
  faltantes,
  agruparAportacionesPorTienda,
  tiempoRestante,
  construirMensajeWhatsApp,
} from "./logic";
export {
  listarVaquitas,
  getVaquita,
  getVaquitaAbiertaPorProducto,
  getAportacionesPorTienda,
  listarProductosParaVaquita,
} from "./queries";
export { aportarAVaquita, crearVaquita, recibirPedidoVaquita } from "./actions";
export { VaquitasLista, BarraVaquita } from "./components/VaquitasLista";
export { VaquitaDetalle } from "./components/VaquitaDetalle";
export { QrVaquita } from "./components/QrVaquita";
