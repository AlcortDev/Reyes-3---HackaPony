import { beforeEach, describe, expect, it, vi } from "vitest";

const dobles = vi.hoisted(() => ({
  autorizar: vi.fn(),
  transaccion: vi.fn(),
  buscar: vi.fn(),
  actualizar: vi.fn(),
  movimiento: vi.fn(),
  revalidar: vi.fn(),
}));

vi.mock("@/shared/security", () => ({
  assertTiendaAprobada: dobles.autorizar,
  NoAutorizadoError: class extends Error {},
}));
vi.mock("@/shared/db", () => ({ db: { $transaction: dobles.transaccion } }));
vi.mock("next/cache", () => ({ revalidatePath: dobles.revalidar }));

import { NoAutorizadoError } from "@/shared/security";
import { registrarMovimiento } from "./actions";

const entrada = { inventarioId: "inv-1", tipo: "ENTRADA" as const, cantidad: 10 };

describe("registrarMovimiento [RF-INV-02/03, RN-02/03]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dobles.autorizar.mockResolvedValue({ tienda: { id: "tienda-propia" } });
    dobles.buscar.mockResolvedValue({ id: "inv-1", stock: 15 });
    dobles.actualizar.mockResolvedValue({ count: 1 });
    dobles.movimiento.mockResolvedValue({ id: "mov-1" });
    dobles.transaccion.mockImplementation(async (trabajo) => trabajo({
      inventario: { findFirst: dobles.buscar, updateMany: dobles.actualizar },
      movimiento: { create: dobles.movimiento },
    }));
  });

  it("registra un surtido y devuelve el stock confirmado por el servidor", async () => {
    await expect(registrarMovimiento(entrada)).resolves.toEqual({ ok: true, data: { stock: 15 } });
    expect(dobles.actualizar).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "inv-1", tiendaId: "tienda-propia" }),
      data: { stock: { increment: 10 } },
    }));
    expect(dobles.movimiento).toHaveBeenCalledWith({ data: entrada });
    expect(dobles.revalidar).toHaveBeenCalledWith("/inventario");
    expect(dobles.revalidar).toHaveBeenCalledWith("/inventario/inv-1");
  });

  it("una salida exige stock suficiente en la escritura, incluso con otra venta concurrente", async () => {
    dobles.buscar.mockResolvedValue({ id: "inv-1", stock: 1 });
    dobles.actualizar.mockResolvedValue({ count: 0 });
    await expect(registrarMovimiento({ ...entrada, tipo: "SALIDA", cantidad: 1 }))
      .resolves.toEqual({ ok: false, error: "No hay unidades para sacar" });
    expect(dobles.actualizar).toHaveBeenCalledWith({
      where: { id: "inv-1", tiendaId: "tienda-propia", stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
    expect(dobles.movimiento).not.toHaveBeenCalled();
    expect(dobles.revalidar).toHaveBeenCalledWith("/inventario");
  });

  it("registra una salida y su movimiento en la misma transacción", async () => {
    dobles.buscar.mockResolvedValue({ id: "inv-1", stock: 4 });
    await expect(registrarMovimiento({ ...entrada, tipo: "SALIDA", cantidad: 1 }))
      .resolves.toEqual({ ok: true, data: { stock: 4 } });
    expect(dobles.movimiento).toHaveBeenCalledWith({ data: { ...entrada, tipo: "SALIDA", cantidad: 1 } });
  });

  it("no permite tocar un inventario de otra tienda", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(registrarMovimiento(entrada)).resolves.toEqual({ ok: false, error: "Producto no encontrado" });
    expect(dobles.buscar).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "inv-1", tiendaId: "tienda-propia" },
    }));
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.movimiento).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 10_001, Number.NaN, Number.POSITIVE_INFINITY, "2", null])(
    "rechaza una cantidad inválida (%s) antes de acceder a la base de datos", async (cantidad) => {
      await expect(registrarMovimiento({ ...entrada, cantidad } as typeof entrada))
        .resolves.toEqual({ ok: false, error: "Cantidad inválida" });
      expect(dobles.transaccion).not.toHaveBeenCalled();
    },
  );

  it("exige una tienda aprobada antes de validar o consultar", async () => {
    dobles.autorizar.mockRejectedValue(new NoAutorizadoError(403));
    const resultado = await registrarMovimiento(entrada);
    expect(resultado.ok).toBe(false);
    expect(dobles.transaccion).not.toHaveBeenCalled();
  });

  it("devuelve un error seguro si falla el historial; no confirma ni revalida un cambio incompleto", async () => {
    dobles.movimiento.mockRejectedValue(new Error("detalle privado del motor SQL"));
    await expect(registrarMovimiento(entrada)).resolves.toEqual({
      ok: false, error: "No pudimos confirmar el movimiento. Actualiza el inventario antes de volver a intentarlo.",
    });
    expect(dobles.revalidar).not.toHaveBeenCalled();
  });

  it("no invita a repetir si se pierde la confirmación de la transacción", async () => {
    dobles.transaccion.mockRejectedValue(new Error("conexión interrumpida al confirmar"));
    expect(await registrarMovimiento(entrada)).toEqual({
      ok: false, error: "No pudimos confirmar el movimiento. Actualiza el inventario antes de volver a intentarlo.",
    });
  });
});
