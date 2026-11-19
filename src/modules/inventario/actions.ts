"use server";
// Mutaciones del inventario. Dueño: Alvaro.
import { z } from "zod";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";
import type { Resultado } from "@/shared/types";

const movimientoSchema = z.object({
  inventarioId: z.string().min(1),
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
    throw e;
  }

  const datos = movimientoSchema.safeParse(input);
  if (!datos.success) return { ok: false, error: "Cantidad inválida" };

  // TODO(Alvaro) [RF-INV-02/03 · RN-03] En db.$transaction:
  //   1. findFirst({ where: { id: inventarioId, tiendaId } }) → si no existe: "Producto no encontrado"
  //   2. SALIDA que deje stock < 0 → "No hay unidades para sacar"
  //   3. crear Movimiento y actualizar Inventario.stock
  //   4. revalidatePath("/inventario")
  void tiendaId;
  return { ok: false, error: "Por implementar (Alvaro)" };
}
