// 🚪 API pública del módulo tiendas (Hiram: servidor · Sebastían: pantallas).
export {
  cuentaSchema,
  verificacionSchema,
  pasoCuentaSchema,
  pasoTiendaSchema,
  pasoUbicacionSchema,
  motivoSchema,
  CAMPOS_DOCUMENTO,
} from "./schemas";
export { getMiTienda, getTiendaActual, type MiTiendaDTO } from "./queries";
export { registrarCuenta, solicitarVerificacion, resubirDocumentos } from "./actions";
export { PerfilTienda, BannerEstatus, NOMBRE_DOCUMENTO } from "./components/Perfil";
export { HeaderTienda, MenuLateral } from "./components/HeaderTienda";
export { EstructuraTienda } from "./components/EstructuraTienda";
export { RegistroCuenta } from "./components/RegistroCuenta";
export { VerificacionTienda } from "./components/VerificacionTienda";
