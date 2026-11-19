"use server";
// Decisiones del admin sobre tiendas. Dueño: Hiram (servidor).
import type { Resultado } from "@/shared/types";

// TODO(Hiram) [RF-VER-06 · RN-16] en las tres:
//   1. assertAdmin()
//   2. validar transición válida (PENDIENTE→APROBADA/RECHAZADA, APROBADA→SUSPENDIDA) y motivoSchema si aplica
//   3. db.tienda.update({ estatusVerificacion, motivoRechazo, revisadaEn: new Date(), revisadaPorId: admin.id })
//   4. registrarEvento("TIENDA_APROBADA" | "TIENDA_RECHAZADA" | "TIENDA_SUSPENDIDA")
//   5. enviarCorreo("tiendaAprobada" | "tiendaRechazada", ...) y revalidatePath("/admin/tiendas")

export async function aprobarTienda(tiendaId: string): Promise<Resultado> {
  void tiendaId;
  return { ok: false, error: "Por implementar (Hiram)" };
}

export async function rechazarTienda(tiendaId: string, motivo: string): Promise<Resultado> {
  void tiendaId;
  void motivo;
  return { ok: false, error: "Por implementar (Hiram)" };
}

/** [RF-VER-08 · COULD] */
export async function suspenderTienda(tiendaId: string, motivo: string): Promise<Resultado> {
  void tiendaId;
  void motivo;
  return { ok: false, error: "Por implementar (Hiram)" };
}
