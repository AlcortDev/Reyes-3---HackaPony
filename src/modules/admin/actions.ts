"use server";
// Decisiones del admin sobre tiendas. Dueño: Hiram (servidor).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/db";
import { assertAdmin } from "@/shared/security";
import { registrarEvento } from "@/shared/security/audit";
import { enviarCorreo } from "@/shared/mail";
import type { Resultado } from "@/shared/types";
import { ok, fallo } from "@/shared/types";
import { motivoSchema } from "@/modules/tiendas";

export async function aprobarTienda(tiendaId: string): Promise<Resultado> {
  const admin = await assertAdmin();
  const tienda = await db.tienda.findUnique({
    where: { id: tiendaId },
    include: { usuario: true },
  });
  if (!tienda) return fallo("Tienda no encontrada");
  if (tienda.estatusVerificacion !== "PENDIENTE") {
    return fallo("Solo se pueden aprobar tiendas en estado pendiente");
  }

  await db.tienda.update({
    where: { id: tiendaId },
    data: {
      estatusVerificacion: "APROBADA",
      motivoRechazo: null,
      revisadaEn: new Date(),
      revisadaPorId: admin.user.id,
    },
  });

  await registrarEvento("TIENDA_APROBADA", {
    exito: true,
    userId: admin.user.id,
    objetivo: tienda.id,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await enviarCorreo("tiendaAprobada", tienda.usuario.email, {
    nombre: tienda.encargado,
    tienda: tienda.nombre,
    url: `${appUrl}/login`,
  });

  revalidatePath("/admin/tiendas");
  return ok(undefined);
}

export async function rechazarTienda(tiendaId: string, motivo: string): Promise<Resultado> {
  const admin = await assertAdmin();
  const parseMotivo = motivoSchema.safeParse(motivo);
  if (!parseMotivo.success) {
    return fallo(parseMotivo.error.issues[0]?.message ?? "Motivo inválido");
  }

  const tienda = await db.tienda.findUnique({
    where: { id: tiendaId },
    include: { usuario: true },
  });
  if (!tienda) return fallo("Tienda no encontrada");
  if (tienda.estatusVerificacion !== "PENDIENTE") {
    return fallo("Solo se pueden rechazar tiendas en estado pendiente");
  }

  await db.tienda.update({
    where: { id: tiendaId },
    data: {
      estatusVerificacion: "RECHAZADA",
      motivoRechazo: parseMotivo.data,
      revisadaEn: new Date(),
      revisadaPorId: admin.user.id,
    },
  });

  await registrarEvento("TIENDA_RECHAZADA", {
    exito: true,
    userId: admin.user.id,
    objetivo: tienda.id,
    detalle: { motivo: parseMotivo.data },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await enviarCorreo("tiendaRechazada", tienda.usuario.email, {
    nombre: tienda.encargado,
    tienda: tienda.nombre,
    motivo: parseMotivo.data,
    url: `${appUrl}/perfil`,
  });

  revalidatePath("/admin/tiendas");
  return ok(undefined);
}

/** [RF-VER-08 · RN-16] SUSPENDIDA → APROBADA. */
export async function reactivarTienda(tiendaId: string): Promise<Resultado> {
  const admin = await assertAdmin();
  const tienda = await db.tienda.findUnique({
    where: { id: tiendaId },
    include: { usuario: true },
  });
  if (!tienda) return fallo("Tienda no encontrada");
  if (tienda.estatusVerificacion !== "SUSPENDIDA") {
    return fallo("Solo se pueden reactivar tiendas suspendidas");
  }

  await db.tienda.update({
    where: { id: tiendaId },
    data: {
      estatusVerificacion: "APROBADA",
      motivoRechazo: null,
      revisadaEn: new Date(),
      revisadaPorId: admin.user.id,
    },
  });

  await registrarEvento("TIENDA_REACTIVADA", {
    exito: true,
    userId: admin.user.id,
    objetivo: tienda.id,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await enviarCorreo("tiendaAprobada", tienda.usuario.email, {
    nombre: tienda.encargado,
    tienda: tienda.nombre,
    url: `${appUrl}/login`,
  });

  revalidatePath("/admin/tiendas");
  return ok(undefined);
}

/** [RF-VER-08 · COULD] */
export async function suspenderTienda(tiendaId: string, motivo: string): Promise<Resultado> {
  const admin = await assertAdmin();
  const parseMotivo = motivoSchema.safeParse(motivo);
  if (!parseMotivo.success) {
    return fallo(parseMotivo.error.issues[0]?.message ?? "Motivo inválido");
  }

  const tienda = await db.tienda.findUnique({
    where: { id: tiendaId },
    include: { usuario: true },
  });
  if (!tienda) return fallo("Tienda no encontrada");
  if (tienda.estatusVerificacion !== "APROBADA") {
    return fallo("Solo se pueden suspender tiendas aprobadas");
  }

  await db.tienda.update({
    where: { id: tiendaId },
    data: {
      estatusVerificacion: "SUSPENDIDA",
      motivoRechazo: parseMotivo.data,
      revisadaEn: new Date(),
      revisadaPorId: admin.user.id,
    },
  });

  await registrarEvento("TIENDA_SUSPENDIDA", {
    exito: true,
    userId: admin.user.id,
    objetivo: tienda.id,
    detalle: { motivo: parseMotivo.data },
  });

  revalidatePath("/admin/tiendas");
  return ok(undefined);
}

const precioSchema = z.object({
  productoId: z.string().min(1).max(128),
  precioMayoreo: z.number().positive().max(100_000),
});

/** [RN-11] Solo el ADMIN fija el precio de mayoreo del catálogo; debe ser menor al de menudeo. */
export async function actualizarPrecioMayoreo(input: { productoId: string; precioMayoreo: number }): Promise<Resultado> {
  const admin = await assertAdmin();
  const datos = precioSchema.safeParse(input);
  if (!datos.success) return fallo("Escribe un precio válido (mayor a $0).");

  const producto = await db.producto.findUnique({ where: { id: datos.data.productoId } });
  if (!producto) return fallo("Producto no encontrado");
  const precio = Math.round(datos.data.precioMayoreo * 100) / 100;
  if (precio >= producto.precioMenudeo) {
    return fallo(`Debe ser menor al precio de menudeo (${producto.precioMenudeo.toFixed(2)}).`);
  }

  await db.producto.update({ where: { id: producto.id }, data: { precioMayoreo: precio } });
  await registrarEvento("PRECIO_MAYOREO_ACTUALIZADO", {
    exito: true,
    userId: admin.user.id,
    objetivo: producto.id,
    detalle: { antes: producto.precioMayoreo, despues: precio },
  });
  revalidatePath("/admin/productos");
  revalidatePath("/vaquitas");
  return ok(undefined);
}
