import { describe, expect, it } from "vitest";
import { calcularAhorro } from "./logic";

describe("calcularAhorro [RN-09]", () => {
  it("CA RF-AHO-01: 30 Cocas de $18.00 a $14.50 → $105.00", () => {
    expect(calcularAhorro(18, 14.5, 30)).toBe(105);
  });
  it("nunca es negativo", () => {
    expect(calcularAhorro(10, 12, 5)).toBe(0);
  });
});
