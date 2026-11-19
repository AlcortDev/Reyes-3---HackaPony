// 🚪 API pública del módulo admin (Hiram: servidor · Sebastían: pantallas).
export { listarTiendasPorEstatus, getTiendaParaRevision, type SolicitudDTO, type RevisionDTO } from "./queries";
export { aprobarTienda, rechazarTienda, suspenderTienda } from "./actions";
export { TablaSolicitudes, RevisionTienda } from "./components/Admin";
