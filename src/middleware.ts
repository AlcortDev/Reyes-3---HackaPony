// [RF-TIE-02] Capa 1 de 3: solo revisa que exista la cookie de sesión (rápido, sin BD).
// La verificación REAL (sesión válida, rol, estatus) se hace en layouts y en cada server action.
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/registro", "/recuperar", "/restablecer", "/verificar-correo", "/privacidad"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const tieneCookie = !!getSessionCookie(request);

  if (!esPublica && !tieneCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo excepto API, archivos estáticos e imágenes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
