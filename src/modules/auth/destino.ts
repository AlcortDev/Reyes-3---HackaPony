// Función pura: a dónde mandar al usuario después de iniciar sesión.

/** Solo rutas internas de la app (evita redirecciones abiertas a otros sitios). */
export function destinoSeguro(siguiente: string | null, origen: string): string {
  if (!siguiente || !siguiente.startsWith("/") || siguiente.startsWith("//") || siguiente.startsWith("/\\")) return "/";
  try {
    const url = new URL(siguiente, origen);
    if (url.origin !== origen || url.pathname.startsWith("/api") || url.pathname === "/login") return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}
