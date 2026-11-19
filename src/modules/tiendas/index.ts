// 🚪 API pública del módulo tiendas (Hiram: servidor · Sebastían: pantallas).
export {
  registroSchema,
  pasoCuentaSchema,
  pasoTiendaSchema,
  pasoUbicacionSchema,
  motivoSchema,
  CAMPOS_DOCUMENTO,
} from "./schemas";
export { getMiTienda, getTiendaActual, type MiTiendaDTO } from "./queries";
export { registrarTienda, resubirDocumentos } from "./actions";
export { PerfilTienda, BannerEstatus } from "./components/Perfil";
export { HeaderTienda } from "./components/HeaderTienda";
export { RegistroWizard } from "./components/RegistroWizard";
