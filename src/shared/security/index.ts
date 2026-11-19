// API pública de seguridad compartida (Hiram). Ver docs/SRS.md §6.3 "@/shared/security".
export {
  NoAutorizadoError,
  getSesion,
  requireSession,
  requireAdmin,
  requireTiendaAprobada,
  assertSession,
  assertAdmin,
  assertTiendaAprobada,
} from "./guards";
export { registrarEvento, type EventoAuditoria, type ContextoAuditoria } from "./audit";
export { evaluarIntentoFallido, estaBloqueada, MAX_INTENTOS, MINUTOS_BLOQUEO } from "./lockout";
export { cifrar, descifrar, sha256 } from "./crypto";
export { validarArchivo, limpiarArchivo, MIME_IMAGEN, MIME_DOCUMENTO, MAX_BYTES, type MimePermitido } from "./uploads";
export { limitarIntentos } from "./rate-limit";
export { datosDelRequest } from "./request";
export { configuracionIpDesdeEnv, resolverIpCliente, type ConfigIp } from "./ip";
export { errorCredencialesInvalidas, CREDENCIALES_INVALIDAS } from "./auth-errores";
