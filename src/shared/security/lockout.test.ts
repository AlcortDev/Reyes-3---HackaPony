import { describe, expect, it } from "vitest";
import { estaBloqueada, evaluarIntentoFallido, MAX_INTENTOS, MINUTOS_BLOQUEO } from "./lockout";

describe("evaluarIntentoFallido [RN-14]", () => {
  const ahora = new Date("2026-11-19T12:00:00Z");

  it("suma intentos sin bloquear antes del máximo", () => {
    expect(evaluarIntentoFallido(0, ahora)).toEqual({ intentos: 1, lockedUntil: null });
    expect(evaluarIntentoFallido(MAX_INTENTOS - 2, ahora).lockedUntil).toBeNull();
  });

  it("bloquea 15 min al llegar al máximo y reinicia el contador", () => {
    const r = evaluarIntentoFallido(MAX_INTENTOS - 1, ahora);
    expect(r.intentos).toBe(0);
    expect(r.lockedUntil?.getTime()).toBe(ahora.getTime() + MINUTOS_BLOQUEO * 60_000);
  });

  it("estaBloqueada respeta la hora", () => {
    const hasta = new Date(ahora.getTime() + 60_000);
    expect(estaBloqueada(hasta, ahora)).toBe(true);
    expect(estaBloqueada(hasta, new Date(hasta.getTime() + 1))).toBe(false);
    expect(estaBloqueada(null, ahora)).toBe(false);
  });
});
