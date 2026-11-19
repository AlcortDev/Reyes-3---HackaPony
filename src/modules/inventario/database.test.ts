// Opt-in: INVENTARIO_TEST_DATABASE_URL debe apuntar a una base dedicada con este nombre.
// Las fixtures tienen IDs propios; nunca se truncan tablas ni se usa el seed de producción.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const contexto = vi.hoisted(() => {
  const url = process.env.INVENTARIO_TEST_DATABASE_URL;
  if (url) {
    if (new URL(url).pathname !== "/la_vaquita_inventario_test") throw new Error("Usa una base dedicada la_vaquita_inventario_test");
    process.env.DATABASE_URL = url;
  }
  return { autorizar: vi.fn() };
});
vi.mock("@/shared/security", () => ({
  assertTiendaAprobada: contexto.autorizar,
  NoAutorizadoError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/shared/db";
import { registrarMovimiento } from "./actions";
import { buscarInventarioPorCodigo } from "./codigos";
import { getDetalleInventario, getInventarioPorTienda, getProductosBajoStock } from "./queries";

describe.skipIf(!process.env.INVENTARIO_TEST_DATABASE_URL)("inventario con PostgreSQL real", () => {
  const sufijo = randomUUID();
  const usuario = `inv-user-${sufijo}`;
  const otroUsuario = `inv-user-otro-${sufijo}`;
  const tienda = `inv-tienda-${sufijo}`;
  const otraTienda = `inv-tienda-otra-${sufijo}`;
  const producto = `inv-producto-${sufijo}`;
  const inventario = `inv-stock-${sufijo}`;
  const ajeno = `inv-stock-ajeno-${sufijo}`;

  beforeAll(async () => {
    await db.user.createMany({ data: [usuario, otroUsuario].map((id) => ({ id, name: "Prueba", email: `${id}@example.test` })) });
    await db.tienda.createMany({ data: [
      { id: tienda, usuarioId: usuario }, { id: otraTienda, usuarioId: otroUsuario },
    ].map((identidad) => ({ ...identidad, nombre: "Tienda de prueba", encargado: "Prueba", telefono: "0000000000",
      direccion: "Dirección de prueba", lat: 19.7, lng: -101.2, estatusVerificacion: "APROBADA" as const })) });
    await db.producto.create({ data: { id: producto, nombre: "Arroz de prueba", categoria: "Abarrotes", unidad: "bolsa", precioMenudeo: 32, codigoBarras: `INV-${sufijo}` } });
    await db.inventario.createMany({ data: [
      { id: inventario, tiendaId: tienda, productoId: producto, stock: 4, stockMinimo: 6 },
      { id: ajeno, tiendaId: otraTienda, productoId: producto, stock: 100, stockMinimo: 6 },
    ] });
  });

  beforeEach(async () => {
    contexto.autorizar.mockResolvedValue({ tienda: { id: tienda } });
    await db.movimiento.deleteMany({ where: { inventarioId: { in: [inventario, ajeno] } } });
    await db.inventario.update({ where: { id: inventario }, data: { stock: 4 } });
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: [usuario, otroUsuario] } } });
    await db.producto.deleteMany({ where: { id: producto } });
    await db.$disconnect();
  });

  it("surtir 10 unidades actualiza existencias e historial", async () => {
    expect(await registrarMovimiento({ inventarioId: inventario, tipo: "ENTRADA", cantidad: 10 }))
      .toEqual({ ok: true, data: { stock: 14 } });
    const detalle = await getDetalleInventario(inventario, tienda);
    expect(detalle?.stock).toBe(14);
    expect(detalle?.movimientos).toEqual([expect.objectContaining({ tipo: "ENTRADA", cantidad: 10 })]);
  });

  it("el mismo código devuelve únicamente el inventario de la tienda activa y no mueve stock", async () => {
    expect(await buscarInventarioPorCodigo(`INV-${sufijo}`)).toEqual({ ok: true, data: { inventarioId: inventario } });
    contexto.autorizar.mockResolvedValue({ tienda: { id: otraTienda } });
    expect(await buscarInventarioPorCodigo(`INV-${sufijo}`)).toEqual({ ok: true, data: { inventarioId: ajeno } });
    contexto.autorizar.mockResolvedValue({ tienda: { id: "tienda-sin-inventario" } });
    expect((await buscarInventarioPorCodigo(`INV-${sufijo}`)).ok).toBe(false);
    expect(await db.movimiento.count({ where: { inventarioId: { in: [inventario, ajeno] } } })).toBe(0);
  });

  it("solo una de tres salidas simultáneas puede tomar la última unidad", async () => {
    await db.inventario.update({ where: { id: inventario }, data: { stock: 1 } });
    const resultados = await Promise.all(Array.from({ length: 3 }, () =>
      registrarMovimiento({ inventarioId: inventario, tipo: "SALIDA", cantidad: 1 }),
    ));
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(resultados.filter((r) => !r.ok)).toEqual([
      { ok: false, error: "No hay unidades para sacar" }, { ok: false, error: "No hay unidades para sacar" },
    ]);
    expect((await db.inventario.findUniqueOrThrow({ where: { id: inventario } })).stock).toBe(0);
    expect(await db.movimiento.count({ where: { inventarioId: inventario } })).toBe(1);
  });

  it("no permite leer ni modificar el producto de otra tienda", async () => {
    expect(await getDetalleInventario(ajeno, tienda)).toBeNull();
    expect((await getInventarioPorTienda(tienda)).map((item) => item.id)).toEqual([inventario]);
    expect(await registrarMovimiento({ inventarioId: ajeno, tipo: "SALIDA", cantidad: 1 }))
      .toEqual({ ok: false, error: "Producto no encontrado" });
    expect((await db.inventario.findUniqueOrThrow({ where: { id: ajeno } })).stock).toBe(100);
    expect(await db.movimiento.count({ where: { inventarioId: ajeno } })).toBe(0);
  });

  it("la alerta cambia al cruzar el mínimo", async () => {
    await db.inventario.update({ where: { id: inventario }, data: { stock: 7 } });
    expect(await getProductosBajoStock(tienda)).toEqual([]);
    await registrarMovimiento({ inventarioId: inventario, tipo: "SALIDA", cantidad: 2 });
    expect(await getProductosBajoStock(tienda)).toEqual([expect.objectContaining({ stock: 5, nivel: "critico" })]);
  });

  it("la predicción suma todas las salidas recientes, no solo las 20 visibles", async () => {
    await db.inventario.update({ where: { id: inventario }, data: { stock: 20 } });
    const ahora = Date.now();
    await db.movimiento.createMany({ data: [
      ...Array.from({ length: 28 }, (_, i) => ({ inventarioId: inventario, tipo: "SALIDA" as const, cantidad: 1, fecha: new Date(ahora - (i + 1) * 3_600_000) })),
      { inventarioId: inventario, tipo: "ENTRADA", cantidad: 100, fecha: new Date(ahora - 60_000) },
      { inventarioId: inventario, tipo: "SALIDA", cantidad: 1000, fecha: new Date(ahora - 8 * 86_400_000) },
    ] });
    const detalle = await getDetalleInventario(inventario, tienda);
    expect(detalle?.diasParaAgotarse).toBe(5);
    expect(detalle?.movimientos).toHaveLength(20);
  });

  it("un error al guardar el historial revierte también el surtido", async () => {
    // Fallo real del motor, no mock de la transacción. Solo existe en la base de pruebas.
    await db.$executeRaw`CREATE OR REPLACE FUNCTION inventario_test_rechazar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.cantidad = 9999 THEN RAISE EXCEPTION 'rechazo de prueba'; END IF; RETURN NEW; END; $$`;
    await db.$executeRaw`CREATE TRIGGER inventario_test_rechazo BEFORE INSERT ON "Movimiento" FOR EACH ROW EXECUTE FUNCTION inventario_test_rechazar()`;
    try {
      expect(await registrarMovimiento({ inventarioId: inventario, tipo: "ENTRADA", cantidad: 9999 }))
        .toEqual({ ok: false, error: "No pudimos confirmar el movimiento. Actualiza el inventario antes de volver a intentarlo." });
      expect((await db.inventario.findUniqueOrThrow({ where: { id: inventario } })).stock).toBe(4);
      expect(await db.movimiento.count({ where: { inventarioId: inventario } })).toBe(0);
    } finally {
      await db.$executeRaw`DROP TRIGGER IF EXISTS inventario_test_rechazo ON "Movimiento"`;
      await db.$executeRaw`DROP FUNCTION IF EXISTS inventario_test_rechazar()`;
    }
  });
});
