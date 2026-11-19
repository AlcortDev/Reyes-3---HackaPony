// [RN-14 · RNF-SEC-05] Bloqueo de cuenta por intentos fallidos. Funciones puras (sin BD).

export const MAX_INTENTOS = 5;
export const MINUTOS_BLOQUEO = 15;

/** Calcula el nuevo estado tras un intento fallido. Al llegar a 5 se bloquea y el contador vuelve a 0. */
export function evaluarIntentoFallido(
  intentos: number,
  ahora: Date,
): { intentos: number; lockedUntil: Date | null } {
  const nuevos = intentos + 1;
  if (nuevos >= MAX_INTENTOS) {
    return { intentos: 0, lockedUntil: new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60_000) };
  }
  return { intentos: nuevos, lockedUntil: null };
}

export function estaBloqueada(lockedUntil: Date | null | undefined, ahora: Date): boolean {
  return !!lockedUntil && lockedUntil.getTime() > ahora.getTime();
}
