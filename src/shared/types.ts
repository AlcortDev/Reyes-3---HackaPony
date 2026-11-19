// Tipos compartidos entre módulos — ver docs/SRS.md §6.3

/** Resultado estándar de toda server action. `error` es un mensaje listo para mostrar. */
export type Resultado<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const ok = <T>(data: T): Resultado<T> => ({ ok: true, data });
export const fallo = (error: string): Resultado<never> => ({ ok: false, error });

export type EstadoCanasta = "ABIERTA" | "COMPLETA" | "CERRADA";
export type EstatusVerificacion = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "SUSPENDIDA";
export type TipoDocumento = "FACHADA" | "COMPROBANTE_DOMICILIO" | "IDENTIFICACION";
export type Rol = "TENDERO" | "ADMIN";

export interface TiendaDTO {
  id: string;
  nombre: string;
  encargado: string;
  direccion: string;
  lat: number;
  lng: number;
  estatusVerificacion: EstatusVerificacion;
}

export interface UsuarioDTO {
  id: string;
  name: string;
  email: string;
  role: Rol;
}
