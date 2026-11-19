import { beforeEach, describe, expect, it, vi } from "vitest";

const dobles = vi.hoisted(() => ({ listar: vi.fn(), detalle: vi.fn(), sumar: vi.fn(), transaccion: vi.fn() }));
vi.mock("@/shared/db", () => ({ db: {
  $transaction: dobles.transaccion,
  inventario: { findMany: dobles.listar, findFirst: dobles.detalle },
  movimiento: { aggregate: dobles.sumar },
} }));

import { getDetalleInventario, getInventarioPorTienda, getProductosBajoStock } from "./queries";

const producto = {
  id: "producto-1", nombre: "Arroz 1 kg", categoria: "Abarrotes", unidad: "bolsa",
  imagen: null, precioMenudeo: 32,
};
const fila = { id: "inventario-1", productoId: producto.id, tiendaId: "tienda-1", stock: 4, stockMinimo: 6, producto };

describe("lecturas de inventario [RF-INV-01, 04…07]", () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.useRealTimers();
    dobles.transaccion.mockImplementation(async (trabajo) => trabajo({
      inventario: { findFirst: dobles.detalle }, movimiento: { aggregate: dobles.sumar },
    }));
  });

  it("consulta solo la tienda solicitada y prioriza críticos, pendientes y sanos", async () => {
    dobles.listar.mockResolvedValue([
      { ...fila, id: "sano", stock: 20 },
      { ...fila, id: "pendiente", stock: 10 },
      { ...fila, id: "critico", stock: 4 },
    ]);
    const items = await getInventarioPorTienda("tienda-1");
    expect(items.map(({ id, nivel }) => [id, nivel])).toEqual([
      ["critico", "critico"], ["pendiente", "bajo"], ["sano", "ok"],
    ]);
    expect(items[0]).toMatchObject({ nombre: "Arroz 1 kg", unidad: "bolsa", precioMenudeo: 32 });
    expect(dobles.listar).toHaveBeenCalledWith(expect.objectContaining({ where: { tiendaId: "tienda-1" } }));
    expect(items[0]).not.toHaveProperty("tiendaId");
  });

  it("un inventario vacío no se reemplaza por datos demo", async () => {
    dobles.listar.mockResolvedValue([]);
    await expect(getInventarioPorTienda("tienda-vacia")).resolves.toEqual([]);
  });

  it("el contrato de bajo stock devuelve únicamente los productos críticos", async () => {
    dobles.listar.mockResolvedValue([{ ...fila, stock: 7 }, fila]);
    expect(await getProductosBajoStock("tienda-1")).toEqual([expect.objectContaining({ stock: 4, nivel: "critico" })]);
  });

  it("un detalle ajeno no revela movimientos ni calcula predicciones", async () => {
    dobles.detalle.mockResolvedValue(null);
    await expect(getDetalleInventario("inventario-ajeno", "tienda-1")).resolves.toBeNull();
    expect(dobles.detalle).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "inventario-ajeno", tiendaId: "tienda-1" },
    }));
    expect(dobles.sumar).not.toHaveBeenCalled();
  });

  it("usa todas las salidas de los siete días para predecir aunque el historial esté limitado", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T18:00:00Z"));
    dobles.detalle.mockResolvedValue({ ...fila, stock: 20, movimientos: [
      { id: "mov-1", tipo: "ENTRADA", cantidad: 10, fecha: new Date("2026-11-19T12:00:00Z") },
    ] });
    dobles.sumar.mockResolvedValue({ _sum: { cantidad: 28 } });
    const detalle = await getDetalleInventario(fila.id, "tienda-1");
    expect(detalle?.diasParaAgotarse).toBe(5);
    expect(dobles.transaccion).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
    expect(detalle?.movimientos[0].fecha).toBe("2026-11-19T12:00:00.000Z");
    expect(dobles.sumar).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      inventarioId: fila.id, tipo: "SALIDA",
      fecha: { gte: new Date("2026-11-12T18:00:00Z"), lte: new Date("2026-11-19T18:00:00Z") },
    }) }));
    vi.useRealTimers();
  });

  it("sin salidas no inventa una fecha de agotamiento", async () => {
    dobles.detalle.mockResolvedValue({ ...fila, movimientos: [] });
    dobles.sumar.mockResolvedValue({ _sum: { cantidad: null } });
    const detalle = await getDetalleInventario(fila.id, "tienda-1");
    expect(detalle?.diasParaAgotarse).toBeNull();
    expect(detalle?.movimientos).toEqual([]);
  });
});
