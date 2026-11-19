import { headers } from "next/headers";

/** IP y user-agent del request actual (para rate limit y bitácora). */
export async function datosDelRequest(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
    return { ip, userAgent: h.get("user-agent") ?? "" };
  } catch {
    return { ip: "127.0.0.1", userAgent: "desconocida" };
  }
}
