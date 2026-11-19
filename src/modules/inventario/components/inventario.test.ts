import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { INVENTARIO_MOCK } from "../mocks";

vi.stubGlobal("React", React);
vi.mock("../actions", () => ({ registrarMovimiento: vi.fn() }));
vi.mock("../codigos", () => ({ buscarInventarioPorCodigo: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { InventarioLista } from "./InventarioLista";
import { DetalleInventarioContenido } from "./DetalleInventarioContenido";
import { ListaCompacta } from "./ListaCompacta";

describe("interfaz de inventario [RF-INV-01…05, RNF-01…05]", () => {
  it("ofrece vender y surtir una unidad con nombres accesibles por producto", () => {
    const html = renderToStaticMarkup(createElement(InventarioLista, { catalogo: [], items: INVENTARIO_MOCK }));
    expect(html).toContain('aria-label="Vender una unidad de Coca-Cola 600 ml"');
    expect(html).toContain('aria-label="Surtir una unidad de Coca-Cola 600 ml"');
    expect(html).toContain('href="/inventario/inv-1"');
    expect(html).toContain("Otra cantidad");
    expect(html).toContain("Buscar producto");
  });

  it("muestra un estado vacío útil sin productos o controles ficticios", () => {
    const html = renderToStaticMarkup(createElement(InventarioLista, { catalogo: [], items: [] }));
    expect(html).toContain("Todavía no hay productos en tu inventario");
    expect(html).not.toContain("Coca-Cola");
    expect(html).not.toContain("Vender una unidad");
    expect(html).toContain("Agregar producto"); // [RF-INV-11] se puede empezar desde cero
  });

  it("comunica niveles con texto, unidades y un contador de productos críticos", () => {
    const html = renderToStaticMarkup(createElement(InventarioLista, { catalogo: [], items: INVENTARIO_MOCK }));
    expect(html).toContain("Urge surtir");
    expect(html).toContain("Pendiente");
    expect(html).toContain("Bien surtido");
    expect(html).toContain("1 producto por agotarse");
    expect(html).toContain("Me quedan");
    expect(html).toContain("bolsa");
  });

  it("explica por qué no se puede vender cuando no hay existencias", () => {
    const html = renderToStaticMarkup(createElement(InventarioLista, { catalogo: [], items: [{ ...INVENTARIO_MOCK[0], stock: 0 }] }));
    expect(html).toContain("No hay unidades para sacar");
  });

  it("ofrece armar una vaquita con el producto precargado si no hay una abierta", () => {
    const item = INVENTARIO_MOCK[0];
    const html = renderToStaticMarkup(createElement(DetalleInventarioContenido, {
      detalle: { ...item, movimientos: [], diasParaAgotarse: null }, vaquita: null,
    }));
    expect(html).toContain('href="/vaquitas?productoId=p-coca"');
    expect(html).toContain("Armar una vaquita");
  });

  it("no invita a crear una compra si falló la consulta de vaquitas", () => {
    const item = INVENTARIO_MOCK[0];
    const html = renderToStaticMarkup(createElement(DetalleInventarioContenido, {
      detalle: { ...item, movimientos: [], diasParaAgotarse: null }, vaquita: null, consultaFallida: true,
    }));
    expect(html).not.toContain("Armar una vaquita");
  });

  it("no ofrece la vaquita en amarillo: bajo stock significa crítico en RN-01", () => {
    const item = INVENTARIO_MOCK[1];
    const html = renderToStaticMarkup(createElement(DetalleInventarioContenido, {
      detalle: { ...item, movimientos: [], diasParaAgotarse: null },
      vaquita: { id: "vaq-1", productoId: item.productoId, producto: item.nombre, proveedor: "Prueba",
        metaUnidades: 100, totalAportado: 70, faltan: 30, porcentaje: 70, precioMenudeo: 19,
        precioMayoreo: 15, estado: "ABIERTA", cierraEn: "2099-01-01T00:00:00Z" },
    }));
    expect(html).not.toContain("Unirme a la vaquita");
  });

  it("muestra historial, predicción y enlace correcto de la compra colectiva", () => {
    const item = INVENTARIO_MOCK[0];
    const html = renderToStaticMarkup(createElement(DetalleInventarioContenido, {
      detalle: { ...item, diasParaAgotarse: 2, movimientos: [
        { id: "mov-1", tipo: "SALIDA", cantidad: 2, fecha: "2026-11-19T18:00:00Z" },
      ] },
      vaquita: { id: "vaq-1", productoId: item.productoId, producto: item.nombre, proveedor: "Prueba",
        metaUnidades: 100, totalAportado: 70, faltan: 30, porcentaje: 70, precioMenudeo: 18,
        precioMayoreo: 14.5, estado: "ABIERTA", cierraEn: "2099-01-01T00:00:00Z" },
    }));
    expect(html).toContain("Movimientos recientes");
    expect(html).toContain("~2 días");
    expect(html).toContain('href="/vaquitas/vaq-1"');
    expect(html).toContain("$3.50");
  });
});

describe("vista lista del inventario", () => {
  const props = { items: INVENTARIO_MOCK, bloqueado: false, pendiente: null, guardar: vi.fn() };

  it("muestra una fila por producto con semáforo en texto, existencias y − / +", () => {
    const html = renderToStaticMarkup(createElement(ListaCompacta, props));
    expect(html.match(/<li[ >]/g)?.length).toBe(INVENTARIO_MOCK.length);
    expect(html).toContain("Urge surtir");
    expect(html).toContain('aria-label="Vender una unidad de Coca-Cola 600 ml"');
    expect(html).toContain('aria-label="Surtir una unidad de Coca-Cola 600 ml"');
    expect(html).toContain('href="/inventario/inv-1"');
  });

  it("no deja vender si no hay existencias", () => {
    const html = renderToStaticMarkup(createElement(ListaCompacta, { ...props, items: [{ ...INVENTARIO_MOCK[0], stock: 0 }] }));
    expect(html).toMatch(/aria-label="Vender una unidad de [^"]+" disabled/);
  });

  it("la pantalla ofrece cambiar entre tarjetas y lista", () => {
    const html = renderToStaticMarkup(createElement(InventarioLista, { catalogo: [], items: INVENTARIO_MOCK }));
    expect(html).toContain("Tarjetas");
    expect(html).toContain("Lista");
  });
});
