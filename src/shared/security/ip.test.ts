import { describe, expect, it } from "vitest";
import { configuracionIpDesdeEnv, resolverIpCliente, type ConfigIp } from "./ip";

const sinConfianza: ConfigIp = { ipHeaders: [], trustedProxies: [] };

function cabeceras(valores: Record<string, string>) {
  return (nombre: string) => valores[nombre.toLowerCase()];
}

describe("configuracionIpDesdeEnv", () => {
  it("no confía en ningún header por defecto", () => {
    expect(configuracionIpDesdeEnv({})).toEqual({ ipHeaders: [], trustedProxies: [] });
  });

  it("separa y recorta listas de variables de entorno", () => {
    expect(
      configuracionIpDesdeEnv({
        CLIENT_IP_HEADER: " cf-connecting-ip , x-real-ip ",
        TRUSTED_PROXIES: "10.0.0.1, 172.16.0.0/12",
      }),
    ).toEqual({
      ipHeaders: ["cf-connecting-ip", "x-real-ip"],
      trustedProxies: ["10.0.0.1", "172.16.0.0/12"],
    });
  });
});

describe("resolverIpCliente", () => {
  it("ignora x-forwarded-for cuando no hay proxy de confianza configurado", () => {
    const ip = resolverIpCliente(
      cabeceras({ "x-forwarded-for": "203.0.113.99" }),
      sinConfianza,
    );
    expect(ip).toBeNull();
  });

  it("usa solo el header que sobrescribe el proxy de confianza", () => {
    const config: ConfigIp = { ipHeaders: ["cf-connecting-ip"], trustedProxies: [] };
    expect(
      resolverIpCliente(
        cabeceras({ "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "203.0.113.99" }),
        config,
      ),
    ).toBe("198.51.100.7");
  });

  it("rechaza cadenas de varios valores sin proxies de confianza", () => {
    const config: ConfigIp = { ipHeaders: ["x-forwarded-for"], trustedProxies: [] };
    expect(
      resolverIpCliente(cabeceras({ "x-forwarded-for": "203.0.113.99, 198.51.100.7" }), config),
    ).toBeNull();
  });

  it("rechaza valores que no son una IP válida", () => {
    const config: ConfigIp = { ipHeaders: ["x-real-ip"], trustedProxies: [] };
    expect(resolverIpCliente(cabeceras({ "x-real-ip": "no-es-una-ip" }), config)).toBeNull();
  });

  it("salta los proxies de confianza y toma el primer cliente de la derecha", () => {
    const config: ConfigIp = {
      ipHeaders: ["x-forwarded-for"],
      trustedProxies: ["10.0.0.1", "172.16.0.0/12"],
    };
    expect(
      resolverIpCliente(
        cabeceras({ "x-forwarded-for": "203.0.113.99, 172.16.4.5, 10.0.0.1" }),
        config,
      ),
    ).toBe("203.0.113.99");
  });

  it("devuelve null si toda la cadena son proxies de confianza", () => {
    const config: ConfigIp = { ipHeaders: ["x-forwarded-for"], trustedProxies: ["10.0.0.1"] };
    expect(resolverIpCliente(cabeceras({ "x-forwarded-for": "10.0.0.1, 10.0.0.1" }), config)).toBeNull();
  });

  it("acepta rangos CIDR de IPv6", () => {
    const config: ConfigIp = {
      ipHeaders: ["x-forwarded-for"],
      trustedProxies: ["2001:db8::/32"],
    };
    expect(
      resolverIpCliente(
        cabeceras({ "x-forwarded-for": "203.0.113.99, 2001:db8::5" }),
        config,
      ),
    ).toBe("203.0.113.99");
  });

  it("normaliza IPv6 a /64 como Better Auth para impedir rotación dentro de la subred", () => {
    const config: ConfigIp = { ipHeaders: ["cf-connecting-ip"], trustedProxies: [] };
    const esperado = "2001:0db8:abcd:1234:0000:0000:0000:0000";
    expect(
      resolverIpCliente(cabeceras({ "cf-connecting-ip": "2001:db8:abcd:1234::1" }), config),
    ).toBe(esperado);
    expect(
      resolverIpCliente(cabeceras({ "cf-connecting-ip": "2001:db8:abcd:1234:dead::9" }), config),
    ).toBe(esperado);
  });

  it("convierte IPv4 mapeada a su forma IPv4", () => {
    const config: ConfigIp = { ipHeaders: ["cf-connecting-ip"], trustedProxies: [] };
    expect(resolverIpCliente(cabeceras({ "cf-connecting-ip": "::ffff:192.0.2.1" }), config)).toBe(
      "192.0.2.1",
    );
  });

  it("ignora entradas de proxy inválidas en la configuración", () => {
    const config: ConfigIp = {
      ipHeaders: ["x-forwarded-for"],
      trustedProxies: ["basura", "10.0.0.1"],
    };
    expect(
      resolverIpCliente(cabeceras({ "x-forwarded-for": "203.0.113.99, 10.0.0.1" }), config),
    ).toBe("203.0.113.99");
  });
});
