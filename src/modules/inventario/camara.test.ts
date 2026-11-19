import { describe, expect, it, vi } from "vitest";
import { capturaVigente, detenerStream } from "./camara";

describe("ciclo de cámara [RF-INV-10]", () => {
  it("detiene todos los tracks sin depender de playing ni del estado del decodificador", () => {
    const primero = { stop: vi.fn() }, segundo = { stop: vi.fn() };
    detenerStream({ getTracks: () => [primero, segundo] } as unknown as MediaStream);
    expect(primero.stop).toHaveBeenCalledOnce();
    expect(segundo.stop).toHaveBeenCalledOnce();
  });
  it("cerrar antes de obtener un stream no falla", () => {
    expect(() => detenerStream(null)).not.toThrow();
  });
  it("descarta callbacks de una sesión cerrada o de un lector sustituido", () => {
    const lector = {}, nuevo = {};
    expect(capturaVigente(1, 2, lector, lector)).toBe(false);
    expect(capturaVigente(1, 1, lector, nuevo)).toBe(false);
    expect(capturaVigente(1, 1, lector, null)).toBe(false);
    expect(capturaVigente(2, 2, nuevo, nuevo)).toBe(true);
  });
});
