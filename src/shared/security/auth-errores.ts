// [RNF-SEC-06] Error indistinguible para credenciales inválidas y cuenta bloqueada.
// Estos valores deben coincidir con BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD
// de Better Auth (verificado en 1.7.26). Si Better Auth cambia su mensaje,
// actualizar ambos a la vez: cualquier diferencia es un oráculo de enumeración.
import { APIError } from "better-auth/api";

export const CREDENCIALES_INVALIDAS = {
  code: "INVALID_EMAIL_OR_PASSWORD",
  message: "Invalid email or password",
} as const;

export function errorCredencialesInvalidas(): APIError {
  // APIError.from reconstruye el cuerpo como {message, code} en ese orden.
  // Usar new APIError con {code, message} cambiaría los bytes de la respuesta
  // y permitiría distinguir una cuenta bloqueada de un correo inexistente.
  return APIError.from("UNAUTHORIZED", CREDENCIALES_INVALIDAS);
}
