import { describe, expect, it } from "vitest";
import type { VaquitaDTO } from "@/modules/vaquitas";
import { vaquitaVigente } from "./oportunidad";

const abierta: VaquitaDTO = {
  id: "vaq-1", productoId: "p-1", producto: "Arroz", proveedor: "Proveedor de prueba",
  metaUnidades: 100, totalAportado: 70, faltan: 30, porcentaje: 70,
  precioMenudeo: 18, precioMayoreo: 14.5, estado: "ABIERTA", cierraEn: "2026-11-21T12:00:00Z",
};
const ahora = new Date("2026-11-19T12:00:00Z");

describe("enlace de inventario a vaquita [RF-INV-08]", () => {
  it("ofrece la compra abierta del mismo producto con unidades disponibles", () => {
    expect(vaquitaVigente(abierta, abierta.productoId, ahora)).toEqual(abierta);
  });
  it.each([
    { ...abierta, estado: "COMPLETA" as const },
    { ...abierta, estado: "CERRADA" as const },
    { ...abierta, cierraEn: ahora.toISOString() },
    { ...abierta, cierraEn: "fecha inválida" },
    { ...abierta, totalAportado: abierta.metaUnidades },
    { ...abierta, productoId: "producto-ajeno" },
  ])("no invita a una compra inválida o de otro producto (%j)", (vaquita) => {
    expect(vaquitaVigente(vaquita, abierta.productoId, ahora)).toBeNull();
  });
  it("sin vaquita devuelve ausencia, sin inventar una compra", () => {
    expect(vaquitaVigente(null, abierta.productoId, ahora)).toBeNull();
  });
});
