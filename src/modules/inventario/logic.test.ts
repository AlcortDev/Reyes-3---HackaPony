import { describe, expect, it } from "vitest";
import { diasParaAgotarse, nivelStock } from "./logic";

describe("nivelStock [RN-01]", () => {
  it("clasifica por umbrales", () => {
    expect(nivelStock(6, 6)).toBe("critico");
    expect(nivelStock(7, 6)).toBe("bajo");
    expect(nivelStock(12, 6)).toBe("bajo");
    expect(nivelStock(13, 6)).toBe("ok");
  });
});

describe("diasParaAgotarse [RN-07]", () => {
  it("calcula con el promedio de 7 días", () => {
    expect(diasParaAgotarse(10, 14)).toBe(5); // 2 por día
  });
  it("sin salidas no hay predicción", () => {
    expect(diasParaAgotarse(10, 0)).toBeNull();
  });
});

import { movimientoParaAjuste } from "./logic";

describe("movimientoParaAjuste (conteo físico)", () => {
  it("calcula la entrada o salida que deja el stock en el número contado", () => {
    expect(movimientoParaAjuste(19, 20)).toEqual({ tipo: "ENTRADA", cantidad: 1 });
    expect(movimientoParaAjuste(19, 12)).toEqual({ tipo: "SALIDA", cantidad: 7 });
    expect(movimientoParaAjuste(0, 30)).toEqual({ tipo: "ENTRADA", cantidad: 30 });
    expect(movimientoParaAjuste(8, 0)).toEqual({ tipo: "SALIDA", cantidad: 8 });
  });
  it("sin diferencia no hay movimiento", () => {
    expect(movimientoParaAjuste(19, 19)).toBeNull();
  });
});
