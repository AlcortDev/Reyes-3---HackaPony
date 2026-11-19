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
