"use server";
// Mutaciones de vaquitas. Dueño: Jesús.
import { z } from "zod";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";
import type { EstadoCanasta, Resultado } from "@/shared/types";

const aportarSchema = z.object({
  canastaId: z.string().min(1),
  cantidad: z.number().int().min(1).max(10_000), // [RN-02]
});

/** [RF-VAQ-02, RF-VAQ-04] La tienda sale de la sesión, NUNCA del cliente. */
export async function aportarAVaquita(input: {
  canastaId: string;
  cantidad: number;
}): Promise<Resultado<{ totalAportado: number; estado: EstadoCanasta }>> {
  let tiendaId: string;
  try {
    ({ tienda: { id: tiendaId } } = await assertTiendaAprobada()); // [RNF-SEC-10]
  } catch (e) {
    if (e instanceof NoAutorizadoError) return { ok: false, error: e.message };
    throw e;
  }

  const datos = aportarSchema.safeParse(input);
  if (!datos.success) return { ok: false, error: "Cantidad inválida" };

  // TODO(Jesús) [RN-04, RN-05, RN-06] En db.$transaction (bloquear la canasta con SELECT … FOR UPDATE vía $queryRaw):
  //   1. canasta ABIERTA y vigente → si no: "Esta vaquita ya cerró"
  //   2. cantidad ≤ faltantes() → si no: "Solo faltan X unidades"
  //   3. crear Aportacion { canastaId, tiendaId, cantidad }
  //   4. si total == meta → estado COMPLETA
  //   5. revalidatePath(`/vaquitas/${canastaId}`)
  void tiendaId;
  return { ok: false, error: "Por implementar (Jesús)" };
}

const crearSchema = z.object({
  productoId: z.string().min(1),
  proveedor: z.string().trim().min(2).max(100),
  metaUnidades: z.number().int().min(2).max(100_000),
  precioMayoreo: z.number().positive(),
  cierraEn: z.coerce.date(),
});

/** [RF-VAQ-06 · RN-11, RN-12] */
export async function crearVaquita(input: z.input<typeof crearSchema>): Promise<Resultado<{ id: string }>> {
  try {
    await assertTiendaAprobada();
  } catch (e) {
    if (e instanceof NoAutorizadoError) return { ok: false, error: e.message };
    throw e;
  }
  const datos = crearSchema.safeParse(input);
  if (!datos.success) return { ok: false, error: "Revisa los datos de la vaquita" };

  // TODO(Jesús) [RN-11] precioMayoreo < precioMenudeo · [RN-12] una sola ABIERTA por producto · cierraEn en el futuro
  return { ok: false, error: "Por implementar (Jesús)" };
}
