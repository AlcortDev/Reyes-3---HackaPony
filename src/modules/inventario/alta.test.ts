import { describe, expect, it } from "vitest";
import { altaInventarioSchema } from "./alta";

const nuevo = { tipo: "nuevo" as const, nombre: "Galletas Marías", categoria: "Galletas", unidad: "pieza", precioMenudeo: 18 };

describe("altaInventarioSchema [RF-INV-11]", () => {
  it("acepta un producto del catálogo con existencias", () => {
    expect(altaInventarioSchema.safeParse({ producto: { tipo: "catalogo", productoId: "p1" }, stockInicial: 12, stockMinimo: 5 }).success).toBe(true);
  });

  it("acepta un producto nuevo; el código vacío queda como sin código", () => {
    const r = altaInventarioSchema.safeParse({ producto: { ...nuevo, codigoBarras: "  " }, stockInicial: 0, stockMinimo: 0 });
    expect(r.success).toBe(true);
    if (r.success && r.data.producto.tipo === "nuevo") expect(r.data.producto.codigoBarras).toBeUndefined();
  });

  it("rechaza existencias negativas o con decimales [RN-02, RN-03]", () => {
    expect(altaInventarioSchema.safeParse({ producto: nuevo, stockInicial: -1, stockMinimo: 2 }).success).toBe(false);
    expect(altaInventarioSchema.safeParse({ producto: nuevo, stockInicial: 1.5, stockMinimo: 2 }).success).toBe(false);
    expect(altaInventarioSchema.safeParse({ producto: nuevo, stockInicial: Number.NaN, stockMinimo: 2 }).success).toBe(false);
  });

  it("rechaza precio en cero y códigos con caracteres raros", () => {
    expect(altaInventarioSchema.safeParse({ producto: { ...nuevo, precioMenudeo: 0 }, stockInicial: 1, stockMinimo: 1 }).success).toBe(false);
    expect(altaInventarioSchema.safeParse({ producto: { ...nuevo, codigoBarras: "75' OR 1=1" }, stockInicial: 1, stockMinimo: 1 }).success).toBe(false);
  });

  it("no acepta un precio de mayoreo del tendero (no existe en el esquema)", () => {
    const r = altaInventarioSchema.safeParse({ producto: { ...nuevo, precioMayoreo: 1 }, stockInicial: 1, stockMinimo: 1 });
    expect(r.success && "precioMayoreo" in r.data.producto).toBe(false);
  });
});
