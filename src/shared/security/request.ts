import { headers } from "next/headers";
import { configuracionIpDesdeEnv, resolverIpCliente } from "./ip";

/** IP y user-agent del request actual (para rate limit y bitácora). */
export async function datosDelRequest(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    // [RNF-SEC-04] misma política de proxy que Better Auth: sin configuración,
    // ningún header del cliente es de confianza y se usa una clave compartida.
    const ip = resolverIpCliente((nombre) => h.get(nombre), configuracionIpDesdeEnv()) ?? "desconocida";
    return { ip, userAgent: h.get("user-agent") ?? "" };
  } catch {
    return { ip: "127.0.0.1", userAgent: "desconocida" };
  }
}
