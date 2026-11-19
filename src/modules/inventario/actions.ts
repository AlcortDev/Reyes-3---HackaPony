"use server";
// Mutaciones del inventario. Dueño: Alvaro.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/shared/db";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";
import type { Resultado } from "@/shared/types";
import { movimientoParaAjuste } from "./logic";
import { MOVIMIENTO_SIN_CONFIRMAR, STOCK_CAMBIO } from "./mensajes";

const movimientoSchema = z.object({
  inventarioId: z.string().trim().min(1).max(128),
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  cantidad: z.number().int().min(1).max(10_000), // [RN-02]
});

/** [RF-INV-02, RF-INV-03] */
export async function registrarMovimiento(input: {
  inventarioId: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
}): Promise<Resultado<{ stock: number }>> {
  let tiendaId: string;
  try {
    ({ tienda: { id: tiendaId } } = await assertTiendaAprobada()); // [RNF-SEC-10]
  } catch (e) {
    if (e instanceof NoAutorizadoError) return { ok: false, error: e.message };
    return { ok: false, error: "No pudimos guardar el movimiento. Intenta de nuevo." };
  }

  const datos = movimientoSchema.safeParse(input);
  if (!datos.success) return { ok: false, error: "Cantidad inválida" };

  const { inventarioId, tipo, cantidad } = datos.data;
  let resultado: Resultado<{ stock: number }>;
  try {
    resultado = await db.$transaction(async (tx): Promise<Resultado<{ stock: number }>> => {
      const propio = await tx.inventario.findFirst({
        where: { id: inventarioId, tiendaId },
        select: { id: true },
      });
      if (!propio) return { ok: false, error: "Producto no encontrado" };

      // El predicado se evalúa al escribir, también si otra venta tomó la última
      // unidad mientras esperábamos el bloqueo de la fila. Nunca leer y restar en JS.
      const cambio = await tx.inventario.updateMany({
        where: {
          id: inventarioId,
          tiendaId,
          stock: tipo === "SALIDA" ? { gte: cantidad } : { lte: 2_147_483_647 - cantidad },
        },
        data: { stock: tipo === "SALIDA" ? { decrement: cantidad } : { increment: cantidad } },
      });
      if (cambio.count !== 1) return {
        ok: false,
        error: tipo === "SALIDA" ? "No hay unidades para sacar" : "La cantidad supera el límite de existencias",
      };

      await tx.movimiento.create({ data: { inventarioId, tipo, cantidad } });
      const actualizado = await tx.inventario.findFirst({
        where: { id: inventarioId, tiendaId },
        select: { stock: true },
      });
      if (!actualizado) throw new Error("Inventario no disponible");
      return { ok: true, data: { stock: actualizado.stock } };
    });
  } catch {
    // Un error de escritura revierte la transacción, pero una conexión perdida
    // durante COMMIT también puede impedir conocer su resultado. Consultar primero.
    return { ok: false, error: MOVIMIENTO_SIN_CONFIRMAR };
  }

  // También refrescar un rechazo: otra pestaña pudo haber tomado la última unidad.
  try {
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${encodeURIComponent(inventarioId)}`);
  } catch {
    // El resultado de la transacción ya se conoce. Un fallo de caché no debe
    // convertir una escritura confirmada en una invitación a repetirla.
    console.error("[inventario] No se pudo actualizar la vista del inventario");
  }
  return resultado;
}

const ajusteSchema = z.object({
  inventarioId: z.string().trim().min(1).max(128),
  existencias: z.number().int().min(0).max(1_000_000), // [RN-02, RN-03] entero, nunca negativo
});

/**
 * [RF-INV-02/03] Conteo físico: "tengo N en total". Registra la diferencia como ENTRADA o SALIDA
 * para que el historial cuadre. La escritura exige que el stock siga siendo el que se leyó: si otra
 * venta lo cambió en medio, no se pisa y se pide volver a intentar.
 */
export async function ajustarExistencias(input: {
  inventarioId: string;
  existencias: number;
}): Promise<Resultado<{ stock: number }>> {
  let tiendaId: string;
  try {
    ({ tienda: { id: tiendaId } } = await assertTiendaAprobada()); // [RNF-SEC-10]
  } catch (e) {
    if (e instanceof NoAutorizadoError) return { ok: false, error: e.message };
    return { ok: false, error: "No pudimos guardar el conteo. Intenta de nuevo." };
  }

  const datos = ajusteSchema.safeParse(input);
  if (!datos.success) return { ok: false, error: "Escribe cuántas tienes en total (un número entero)." };

  const { inventarioId, existencias } = datos.data;
  let resultado: Resultado<{ stock: number }>;
  try {
    resultado = await db.$transaction(async (tx): Promise<Resultado<{ stock: number }>> => {
      const actual = await tx.inventario.findFirst({
        where: { id: inventarioId, tiendaId },
        select: { stock: true },
      });
      if (!actual) return { ok: false, error: "Producto no encontrado" };

      const movimiento = movimientoParaAjuste(actual.stock, existencias);
      if (!movimiento) return { ok: true, data: { stock: actual.stock } };

      const cambio = await tx.inventario.updateMany({
        where: { id: inventarioId, tiendaId, stock: actual.stock },
        data: { stock: existencias },
      });
      if (cambio.count !== 1) return { ok: false, error: STOCK_CAMBIO };

      await tx.movimiento.create({ data: { inventarioId, ...movimiento } });
      return { ok: true, data: { stock: existencias } };
    });
  } catch {
    return { ok: false, error: MOVIMIENTO_SIN_CONFIRMAR };
  }

  try {
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${encodeURIComponent(inventarioId)}`);
  } catch {
    console.error("[inventario] No se pudo actualizar la vista del inventario");
  }
  return resultado;
}
