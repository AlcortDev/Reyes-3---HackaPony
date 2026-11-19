// [RNF-SEC-04] Resolución de IP de cliente con política de proxy de confianza.
// Sin configuración no se confía en ningún header: el cliente puede falsificar
// x-forwarded-for / x-real-ip con curl. Esa misma política se aplica en auth.ts.
import { isIP } from "node:net";

export type ConfigIp = {
  /** Headers que un proxy de confianza SOBREESCRIBE en cada petición. */
  ipHeaders: string[];
  /** IPs o rangos CIDR de proxies que ANTEPONEN su dirección a x-forwarded-for. */
  trustedProxies: string[];
};

type Red = { version: 4 | 6; base: bigint; bits: number };

function separar(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);
}

/** Lee la política desde el entorno. Por defecto, ningún header es de confianza. */
export function configuracionIpDesdeEnv(env: Partial<NodeJS.ProcessEnv> = process.env): ConfigIp {
  return {
    ipHeaders: separar(env.CLIENT_IP_HEADER),
    trustedProxies: separar(env.TRUSTED_PROXIES),
  };
}

function gruposIpv6(ip: string): string[] {
  const [izquierda, derecha = ""] = ip.split("%")[0].split("::");
  const gruposIzq = izquierda ? izquierda.split(":") : [];
  const gruposDer = derecha ? derecha.split(":") : [];
  const faltan = Math.max(0, 8 - gruposIzq.length - gruposDer.length);
  return [...gruposIzq, ...Array<string>(faltan).fill("0"), ...gruposDer];
}

function ipABits(ip: string, version: 4 | 6): bigint {
  if (version === 4) {
    return ip.split(".").reduce((acc, octeto) => (acc << 8n) | BigInt(Number(octeto)), 0n);
  }
  return gruposIpv6(ip).reduce((acc, grupo) => (acc << 16n) | BigInt(parseInt(grupo, 16)), 0n);
}

/** Igual que normalizeIP de Better Auth: IPv4-map → IPv4, IPv6 → subred /64. */
function normalizarIp(ip: string, version: 4 | 6): string {
  if (version === 4) return ip.toLowerCase();
  const mapeada = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapeada && isIP(mapeada[1]) === 4) return mapeada[1];
  const redes = [...gruposIpv6(ip).slice(0, 4), "0", "0", "0", "0"];
  return redes.map((grupo) => parseInt(grupo, 16).toString(16).padStart(4, "0")).join(":");
}

function parsearRed(entrada: string): Red | null {
  const partes = entrada.split("/");
  if (partes.length > 2) return null;
  const [direccion, prefijo] = partes;
  const version = isIP(direccion);
  if (version !== 4 && version !== 6) return null;
  const maxBits = version === 4 ? 32 : 128;
  const bits = prefijo === undefined ? maxBits : Number(prefijo);
  if (!Number.isInteger(bits) || bits < 0 || bits > maxBits) return null;
  return { version, base: ipABits(direccion, version), bits };
}

function contiene(red: Red, ip: bigint): boolean {
  const maxBits = red.version === 4 ? 32 : 128;
  const mascara =
    red.bits === 0 ? 0n : (~0n << BigInt(maxBits - red.bits)) & ((1n << BigInt(maxBits)) - 1n);
  return (ip & mascara) === (red.base & mascara);
}

function resolverCadena(valores: string[], redes: Red[]): string | null {
  if (redes.length === 0) {
    // Sin proxies de confianza, una cadena con varias IPs es falsificable.
    if (valores.length !== 1) return null;
    const version = isIP(valores[0]);
    return version === 4 || version === 6 ? normalizarIp(valores[0], version) : null;
  }
  // Con proxies de confianza se recorre de derecha a izquierda y se descartan sus saltos.
  for (let i = valores.length - 1; i >= 0; i--) {
    const ip = valores[i];
    const version = isIP(ip);
    if (version !== 4 && version !== 6) return null;
    if (redes.some((red) => red.version === version && contiene(red, ipABits(ip, version)))) {
      continue;
    }
    return normalizarIp(ip, version);
  }
  return null;
}

/**
 * Devuelve la IP del cliente o null si no se puede resolver de forma fiable.
 * `obtener` recibe el nombre del header en minúsculas.
 */
export function resolverIpCliente(
  obtener: (nombre: string) => string | null | undefined,
  config: ConfigIp,
): string | null {
  const redes = config.trustedProxies
    .map(parsearRed)
    .filter((red): red is Red => red !== null);

  for (const nombre of config.ipHeaders) {
    const valor = obtener(nombre);
    if (typeof valor !== "string") continue;
    const valores = valor
      .split(",")
      .map((parte) => parte.trim())
      .filter(Boolean);
    if (valores.length === 0) continue;
    const ip = resolverCadena(valores, redes);
    if (ip) return ip;
  }
  return null;
}
