"use server";
// Mutaciones de vaquitas. Dueño: Jesús.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";
import { fallo, ok, type EstadoCanasta, type Resultado } from "@/shared/types";
import { estadoEfectivo, faltantes } from "./logic";

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
    ({
      tienda: { id: tiendaId },
    } = await assertTiendaAprobada()); // [RNF-SEC-10]
  } catch (e) {
    if (e instanceof NoAutorizadoError) return fallo(e.message);
    throw e;
  }

  const datos = aportarSchema.safeParse(input);
  if (!datos.success) return fallo("Cantidad inválida (debe ser un entero mayor o igual a 1)");

  const { canastaId, cantidad } = datos.data;

  const resultado = await db.$transaction(
    async (tx): Promise<Resultado<{ totalAportado: number; estado: EstadoCanasta }>> => {
      // Bloquear la fila de la canasta para evitar condiciones de carrera [ADR-06, RNF-09]
      const filas = await tx.$queryRaw<
        Array<{ id: string; metaUnidades: number; cierraEn: Date; estado: EstadoCanasta }>
      >`SELECT "id", "metaUnidades", "cierraEn", "estado" FROM "Canasta" WHERE "id" = ${canastaId} FOR UPDATE`;

      const canasta = filas[0];
      if (!canasta) {
        return fallo("Vaquita no encontrada");
      }

      const agregado = await tx.aportacion.aggregate({
        where: { canastaId },
        _sum: { cantidad: true },
      });
      const totalActual = agregado._sum.cantidad ?? 0;

      // 1. Verificar que la canasta siga ABIERTA y vigente [RN-04, RN-08]
      const estadoActual = estadoEfectivo(
        canasta.estado,
        new Date(canasta.cierraEn),
        totalActual,
        canasta.metaUnidades,
      );
      if (estadoActual !== "ABIERTA") {
        if (canasta.estado === "ABIERTA") {
          await tx.canasta.update({
            where: { id: canastaId },
            data: { estado: estadoActual },
          });
        }
        return fallo("Esta vaquita ya cerró");
      }

      // 2. Verificar que la aportación no exceda lo que falta [RN-05]
      const quedan = faltantes(totalActual, canasta.metaUnidades);
      if (cantidad > quedan) {
        return fallo(`Solo faltan ${quedan} unidades`);
      }

      // 3. Registrar la aportación
      await tx.aportacion.create({
        data: {
          canastaId,
          tiendaId,
          cantidad,
        },
      });

      // 4. Si se alcanza la meta, pasa a COMPLETA en la misma transacción [RN-06]
      const nuevoTotal = totalActual + cantidad;
      const nuevoEstado: EstadoCanasta = nuevoTotal >= canasta.metaUnidades ? "COMPLETA" : "ABIERTA";
      if (nuevoEstado === "COMPLETA") {
        await tx.canasta.update({
          where: { id: canastaId },
          data: { estado: "COMPLETA" },
        });
      }

      return ok({ totalAportado: nuevoTotal, estado: nuevoEstado });
    },
  );

  if (resultado.ok) {
    revalidatePath("/vaquitas");
    revalidatePath(`/vaquitas/${canastaId}`);
    revalidatePath("/ahorro");
    revalidatePath("/inventario");
  }

  return resultado;
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
    if (e instanceof NoAutorizadoError) return fallo(e.message);
    throw e;
  }

  const datos = crearSchema.safeParse(input);
  if (!datos.success) return fallo("Revisa los datos de la vaquita");

  const { productoId, proveedor, metaUnidades, precioMayoreo, cierraEn } = datos.data;

  if (cierraEn.getTime() <= Date.now()) {
    return fallo("La fecha de cierre debe ser en el futuro");
  }

  const resultado = await db.$transaction(async (tx): Promise<Resultado<{ id: string }>> => {
    const producto = await tx.producto.findUnique({
      where: { id: productoId },
    });
    if (!producto) {
      return fallo("Producto no encontrado");
    }

    // [RN-11] precioMayoreo debe ser menor que precioMenudeo
    if (precioMayoreo >= producto.precioMenudeo) {
      return fallo(
        `El precio de mayoreo debe ser menor al de menudeo ($${producto.precioMenudeo.toFixed(2)})`,
      );
    }

    // [RN-12] Solo puede haber una vaquita ABIERTA por producto a la vez
    const abiertasPrevias = await tx.canasta.findMany({
      where: { productoId, estado: "ABIERTA" },
      include: { aportaciones: { select: { cantidad: true } } },
    });

    for (const previa of abiertasPrevias) {
      const totalPrevia = previa.aportaciones.reduce((acc, a) => acc + a.cantidad, 0);
      const efectivo = estadoEfectivo(previa.estado, previa.cierraEn, totalPrevia, previa.metaUnidades);
      if (efectivo === "ABIERTA") {
        return fallo(`Ya hay una vaquita abierta de ${producto.nombre}`);
      }
      // Si ya venció o se completó, actualizar su estado en BD
      await tx.canasta.update({
        where: { id: previa.id },
        data: { estado: efectivo },
      });
    }

    const creada = await tx.canasta.create({
      data: {
        productoId,
        proveedor,
        metaUnidades,
        precioMayoreo: Math.round(precioMayoreo * 100) / 100,
        cierraEn,
        estado: "ABIERTA",
      },
    });

    return ok({ id: creada.id });
  });

  if (resultado.ok) {
    revalidatePath("/vaquitas");
    revalidatePath("/inventario");
  }

  return resultado;
}

const recibirSchema = z.object({
  canastaId: z.string().min(1),
});

/** [RF-VAQ-11 · COULD] En una vaquita COMPLETA, la tienda marca "Recibido" y suma ENTRADA a su inventario (idempotente). */
export async function recibirPedidoVaquita(input: {
  canastaId: string;
}): Promise<Resultado<{ unidadesRecibidas: number; nuevoStock: number }>> {
  let tiendaId: string;
  let usuarioId: string;
  try {
    ({
      usuario: { id: usuarioId },
      tienda: { id: tiendaId },
    } = await assertTiendaAprobada());
  } catch (e) {
    if (e instanceof NoAutorizadoError) return fallo(e.message);
    throw e;
  }

  const datos = recibirSchema.safeParse(input);
  if (!datos.success) return fallo("Vaquita inválida");

  const { canastaId } = datos.data;
  const claveObjetivo = `${canastaId}:${tiendaId}`;

  const resultado = await db.$transaction(
    async (tx): Promise<Resultado<{ unidadesRecibidas: number; nuevoStock: number }>> => {
      const yaRecibido = await tx.auditLog.findFirst({
        where: {
          evento: "VAQUITA_PEDIDO_RECIBIDO",
          objetivo: claveObjetivo,
          exito: true,
        },
        select: { id: true },
      });
      if (yaRecibido) {
        return fallo("Tu tienda ya recibió las unidades de esta vaquita en su inventario");
      }

      const canasta = await tx.canasta.findUnique({
        where: { id: canastaId },
        include: { aportaciones: true },
      });
      if (!canasta) return fallo("Vaquita no encontrada");

      const totalCanasta = canasta.aportaciones.reduce((acc, a) => acc + a.cantidad, 0);
      const estado = estadoEfectivo(canasta.estado, canasta.cierraEn, totalCanasta, canasta.metaUnidades);
      if (estado !== "COMPLETA") {
        return fallo("Solo puedes recibir el pedido cuando la vaquita está completa");
      }

      const unidadesTienda = canasta.aportaciones
        .filter((a) => a.tiendaId === tiendaId)
        .reduce((acc, a) => acc + a.cantidad, 0);

      if (unidadesTienda <= 0) {
        return fallo("Tu tienda no participó en esta vaquita");
      }

      const inventarioExistente = await tx.inventario.findUnique({
        where: {
          tiendaId_productoId: {
            tiendaId,
            productoId: canasta.productoId,
          },
        },
      });

      const inventario = inventarioExistente
        ? await tx.inventario.update({
            where: { id: inventarioExistente.id },
            data: { stock: { increment: unidadesTienda } },
          })
        : await tx.inventario.create({
            data: {
              tiendaId,
              productoId: canasta.productoId,
              stock: unidadesTienda,
              stockMinimo: 5,
            },
          });

      await tx.movimiento.create({
        data: {
          inventarioId: inventario.id,
          tipo: "ENTRADA",
          cantidad: unidadesTienda,
        },
      });

      await tx.auditLog.create({
        data: {
          evento: "VAQUITA_PEDIDO_RECIBIDO",
          userId: usuarioId,
          objetivo: claveObjetivo,
          exito: true,
          detalle: {
            canastaId,
            tiendaId,
            unidadesRecibidas: unidadesTienda,
            nuevoStock: inventario.stock,
          },
        },
      });

      return ok({ unidadesRecibidas: unidadesTienda, nuevoStock: inventario.stock });
    },
  );

  if (resultado.ok) {
    revalidatePath(`/vaquitas/${canastaId}`);
    revalidatePath("/inventario");
  }

  return resultado;
}
