// [RNF-SEC-11] Bitácora de eventos de seguridad. NUNCA guardar contraseñas, tokens ni contenido de documentos.
import type { Prisma } from "@prisma/client";
import { db } from "@/shared/db";

export type EventoAuditoria =
  | "SIGNUP"
  | "LOGIN_OK"
  | "LOGIN_FAIL"
  | "ACCOUNT_LOCKED"
  | "RESET_REQUESTED"
  | "RESET_DONE"
  | "LOGOUT"
  | "TIENDA_REGISTRADA"
  | "TIENDA_APROBADA"
  | "TIENDA_RECHAZADA"
  | "TIENDA_SUSPENDIDA"
  | "TIENDA_REACTIVADA"
  | "PRECIO_MAYOREO_ACTUALIZADO"
  | "PRODUCTO_AGREGADO"
  | "DOCS_RESUBIDOS"
  | "DOC_VISTO"
  | "DEMO_REINICIADA";

export interface ContextoAuditoria {
  exito: boolean;
  userId?: string | null;
  objetivo?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  detalle?: Prisma.InputJsonValue;
}

/** Nunca lanza: si la bitácora falla, la acción principal no debe romperse. */
export async function registrarEvento(evento: EventoAuditoria, ctx: ContextoAuditoria): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        evento,
        exito: ctx.exito,
        userId: ctx.userId ?? null,
        objetivo: ctx.objetivo ?? null,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent?.slice(0, 300) ?? null,
        detalle: ctx.detalle,
      },
    });
  } catch (e) {
    console.error("[audit] no se pudo registrar", evento, e);
  }
}
