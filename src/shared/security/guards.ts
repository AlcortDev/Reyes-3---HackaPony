// [RNF-SEC-10 · RN-15] Control de acceso en el servidor.
//
// - require*  → para PÁGINAS y LAYOUTS: redirigen (/login o /perfil).
// - assert*   → para SERVER ACTIONS y ROUTE HANDLERS: lanzan NoAutorizadoError (401/403).
//
// La tienda SIEMPRE sale de la sesión. Nunca aceptes tiendaId del cliente para decidir quién actúa.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/auth";
import { db } from "@/shared/db";

export class NoAutorizadoError extends Error {
  constructor(
    public readonly status: 401 | 403,
    mensaje = status === 401 ? "Inicia sesión para continuar" : "No autorizado",
  ) {
    super(mensaje);
    this.name = "NoAutorizadoError";
  }
}

export async function getSesion() {
  return auth.api.getSession({ headers: await headers() });
}

async function buscarTienda(usuarioId: string) {
  return db.tienda.findUnique({ where: { usuarioId } });
}

// ── Páginas / layouts ───────────────────────────────────────

export async function requireSession() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  return sesion;
}

export async function requireAdmin() {
  const sesion = await requireSession();
  if (sesion.user.role !== "ADMIN") redirect("/perfil");
  return sesion;
}

export async function requireTiendaAprobada() {
  const sesion = await requireSession();
  const tienda = await buscarTienda(sesion.user.id);
  if (!tienda || tienda.estatusVerificacion !== "APROBADA") redirect("/perfil");
  return { usuario: sesion.user, tienda };
}

// ── Server actions / route handlers ─────────────────────────

export async function assertSession() {
  const sesion = await getSesion();
  if (!sesion) throw new NoAutorizadoError(401);
  return sesion;
}

export async function assertAdmin() {
  const sesion = await assertSession();
  if (sesion.user.role !== "ADMIN") throw new NoAutorizadoError(403);
  return sesion;
}

export async function assertTiendaAprobada() {
  const sesion = await assertSession();
  const tienda = await buscarTienda(sesion.user.id);
  if (!tienda || tienda.estatusVerificacion !== "APROBADA") throw new NoAutorizadoError(403);
  return { usuario: sesion.user, tienda };
}
