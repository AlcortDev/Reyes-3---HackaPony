import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { MiTiendaDTO } from "../queries";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/perfil",
}));
// El formulario rechazado importa esta acción, pero estas pruebas solo renderizan el perfil.
vi.mock("../actions", () => ({ resubirDocumentos: vi.fn() }));

import { PerfilTienda } from "./Perfil";

const tienda: MiTiendaDTO = {
  id: "tienda-demo",
  usuarioId: "usuario-demo",
  nombre: "Tienda de ejemplo",
  encargado: "Encargado demo",
  telefono: "0000000000",
  direccion: "Dirección de ejemplo",
  lat: 19.7009,
  lng: -101.1804,
  estatusVerificacion: "APROBADA",
  motivoRechazo: null,
  enviadaEn: new Date("2026-11-19T12:00:00Z"),
  revisadaEn: null,
  revisadaPorId: null,
  documentos: [],
};

describe("navegación de Mi cuenta [RF-TIE-01 · RF-VER-05]", () => {
  it("conserva el sidebar y el menú móvil al abrir el perfil de una tienda aprobada", () => {
    const html = renderToStaticMarkup(createElement(PerfilTienda, { tienda }));
    expect(html).toContain("<aside");
    expect(html).toContain('href="/inventario"');
    expect(html).toContain('href="/vaquitas"');
    expect(html).toContain('href="/ahorro"');
    expect(html).toContain('aria-label="Abrir menú de cuenta"');
  });

  it.each(["PENDIENTE", "RECHAZADA", "SUSPENDIDA"] as const)(
    "mantiene el perfil sin navegación a los módulos cuando la tienda está %s",
    (estatusVerificacion) => {
      const html = renderToStaticMarkup(createElement(PerfilTienda, {
        tienda: { ...tienda, estatusVerificacion },
      }));
      expect(html).not.toContain("<aside");
      expect(html).not.toContain('href="/inventario"');
      expect(html).not.toContain('href="/vaquitas"');
      expect(html).not.toContain('href="/ahorro"');
    },
  );

  it("no muestra navegación de una tienda cuando la cuenta todavía no tiene tienda", () => {
    const html = renderToStaticMarkup(createElement(PerfilTienda, { tienda: null }));
    expect(html).not.toContain("<aside");
    expect(html).not.toContain('href="/inventario"');
    expect(html).not.toContain('href="/vaquitas"');
  });
});
