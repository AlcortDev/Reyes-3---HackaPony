"use server";

import type { Resultado } from "@/shared/types";
import { z } from "zod";
import { db } from "@/shared/db";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";

const codigoSchema = z.string().trim().min(1).max(128);

/** [RF-INV-10] Búsqueda por código restringida a la tienda de la sesión. */
export async function buscarInventarioPorCodigo(codigo: string): Promise<Resultado<{ inventarioId: string }>> {
  try {
    const { tienda } = await assertTiendaAprobada();
    const datos = codigoSchema.safeParse(codigo);
    if (!datos.success) return { ok: false, error: "Escribe un código de hasta 128 caracteres." };
    const item = await db.inventario.findFirst({
      where: { tiendaId: tienda.id, producto: { codigoBarras: datos.data } }, select: { id: true },
    });
    return item ? { ok: true, data: { inventarioId: item.id } }
      : { ok: false, error: "No encontramos ese código en tu inventario." };
  } catch (error) {
    return { ok: false, error: error instanceof NoAutorizadoError ? error.message : "No pudimos buscar el producto. Intenta de nuevo." };
  }
}
