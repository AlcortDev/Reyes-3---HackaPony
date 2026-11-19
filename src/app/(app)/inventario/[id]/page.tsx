import { notFound } from "next/navigation";
import { getDetalleInventario, InventarioDetalle } from "@/modules/inventario";
import { requireTiendaAprobada } from "@/shared/security";

export default async function DetalleInventarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tienda } = await requireTiendaAprobada();
  const detalle = await getDetalleInventario(id, tienda.id);
  if (!detalle) notFound();
  return <InventarioDetalle detalle={detalle} />;
}
