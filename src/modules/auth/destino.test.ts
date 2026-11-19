import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino";

const ORIGEN = "http://192.168.1.50:3000";

describe("destinoSeguro (regreso tras login, sin redirección abierta)", () => {
  it("regresa a la vaquita del QR", () => {
    expect(destinoSeguro("/vaquitas/cmi7x2k4a0001", ORIGEN)).toBe("/vaquitas/cmi7x2k4a0001");
    expect(destinoSeguro("/admin/tiendas?estatus=APROBADA", ORIGEN)).toBe("/admin/tiendas?estatus=APROBADA");
  });

  it("sin destino va a la raíz", () => {
    expect(destinoSeguro(null, ORIGEN)).toBe("/");
    expect(destinoSeguro("", ORIGEN)).toBe("/");
  });

  it("bloquea sitios externos y trucos de URL", () => {
    for (const malo of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "evil.example/vaquitas",
    ]) {
      expect(destinoSeguro(malo, ORIGEN)).toBe("/");
    }
  });

  it("no manda a la API ni de vuelta al login", () => {
    expect(destinoSeguro("/api/documentos/abc", ORIGEN)).toBe("/");
    expect(destinoSeguro("/login", ORIGEN)).toBe("/");
  });
});
