// [RF-AUT-01] Redirige según sesión, rol y estatus de la tienda.
import { redirect } from "next/navigation";
import { db } from "@/shared/db";
import { getSesion } from "@/shared/security";

export default async function Inicio() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (sesion.user.role === "ADMIN") redirect("/admin/tiendas");

  const tienda = await db.tienda.findUnique({
    where: { usuarioId: sesion.user.id },
    select: { estatusVerificacion: true },
  });
  if (!tienda) redirect("/verificar-tienda"); // cuenta nueva: falta verificar la tienda
  redirect(tienda.estatusVerificacion === "APROBADA" ? "/inventario" : "/perfil");
}
