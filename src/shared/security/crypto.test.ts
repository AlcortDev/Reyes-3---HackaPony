import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { cifrar, descifrar, sha256 } from "./crypto";

describe("cifrar / descifrar [RNF-SEC-09]", () => {
  beforeAll(() => {
    process.env.DOCS_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  it("ida y vuelta devuelve el mismo contenido", () => {
    const original = Buffer.from("INE de prueba");
    const c = cifrar(original);
    expect(Buffer.from(c.contenido).equals(original)).toBe(false);
    expect(descifrar(c).equals(original)).toBe(true);
    expect(sha256(descifrar(c))).toBe(sha256(original));
  });

  it("detecta manipulación del contenido", () => {
    const c = cifrar(Buffer.from("comprobante"));
    c.contenido[0] = c.contenido[0] ^ 0xff;
    expect(() => descifrar(c)).toThrow();
  });
});
