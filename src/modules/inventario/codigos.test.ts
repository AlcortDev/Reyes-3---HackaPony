import { beforeEach, describe, expect, it, vi } from "vitest";

const dobles = vi.hoisted(() => ({ autorizar: vi.fn(), buscar: vi.fn() }));
vi.mock("@/shared/security", () => ({ assertTiendaAprobada: dobles.autorizar, NoAutorizadoError: class extends Error {} }));
vi.mock("@/shared/db", () => ({ db: { inventario: { findFirst: dobles.buscar } } }));

import { NoAutorizadoError } from "@/shared/security";
import { buscarInventarioPorCodigo } from "./codigos";

describe("búsqueda por código [RF-INV-10]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dobles.autorizar.mockResolvedValue({ tienda: { id: "tienda-propia" } });
    dobles.buscar.mockResolvedValue({ id: "inv-propio" });
  });
  it("encuentra el producto propio, normaliza espacios y no devuelve datos de otras tiendas", async () => {
    expect(await buscarInventarioPorCodigo(" DEMO-COCA ")).toEqual({ ok: true, data: { inventarioId: "inv-propio" } });
    expect(dobles.buscar).toHaveBeenCalledWith({
      where: { tiendaId: "tienda-propia", producto: { codigoBarras: "DEMO-COCA" } }, select: { id: true },
    });
  });
  it.each(["", "  ", "x".repeat(129), null, 123])("rechaza códigos inválidos (%s)", async codigo => {
    expect((await buscarInventarioPorCodigo(codigo as string)).ok).toBe(false);
    expect(dobles.buscar).not.toHaveBeenCalled();
  });
  it("exige autorización antes de consultar", async () => {
    dobles.autorizar.mockRejectedValue(new NoAutorizadoError(403));
    expect((await buscarInventarioPorCodigo("DEMO-COCA")).ok).toBe(false);
    expect(dobles.buscar).not.toHaveBeenCalled();
  });
  it("un código ajeno o inexistente produce el mismo mensaje", async () => {
    dobles.buscar.mockResolvedValue(null);
    expect(await buscarInventarioPorCodigo("AJENO")).toEqual({ ok: false, error: "No encontramos ese código en tu inventario." });
  });
  it("un fallo de conexión no expone detalles del servidor", async () => {
    dobles.buscar.mockRejectedValue(new Error("credenciales privadas del motor"));
    expect(await buscarInventarioPorCodigo("DEMO-COCA")).toEqual({ ok: false, error: "No pudimos buscar el producto. Intenta de nuevo." });
  });
});
