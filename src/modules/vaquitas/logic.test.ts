import { describe, expect, it } from "vitest";
import { estadoEfectivo, faltantes, porcentaje } from "./logic";

describe("estadoEfectivo [RN-06, RN-08]", () => {
  const ahora = new Date("2026-11-19T12:00:00Z");
  const manana = new Date("2026-11-20T12:00:00Z");
  const ayer = new Date("2026-11-18T12:00:00Z");

  it("abierta mientras no llegue a la meta ni venza", () => {
    expect(estadoEfectivo("ABIERTA", manana, 70, 100, ahora)).toBe("ABIERTA");
  });
  it("completa al llegar a la meta", () => {
    expect(estadoEfectivo("ABIERTA", manana, 100, 100, ahora)).toBe("COMPLETA");
  });
  it("cerrada si venció sin meta", () => {
    expect(estadoEfectivo("ABIERTA", ayer, 70, 100, ahora)).toBe("CERRADA");
  });
});

describe("porcentaje y faltantes", () => {
  it("calcula", () => {
    expect(porcentaje(70, 100)).toBe(70);
    expect(porcentaje(120, 100)).toBe(100);
    expect(faltantes(70, 100)).toBe(30);
    expect(faltantes(120, 100)).toBe(0);
  });
});
