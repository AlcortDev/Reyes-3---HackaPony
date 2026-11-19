import { notFound } from "next/navigation";
import { getDetalleInventario } from "@/modules/inventario";
import { Pendiente } from "@/shared/components";
import { requireTiendaAprobada } from "@/shared/security";

export default async function DetalleInventarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tienda } = await requireTiendaAprobada();
  const detalle = await getDetalleInventario(id, tienda.id);
  if (!detalle) notFound();
  // TODO(Alvaro) [RF-INV-06…08] componente de detalle: historial, predicción y alerta → vaquita
  return <Pendiente titulo={detalle.nombre} dueno="Alvaro" requisitos="RF-INV-06, RF-INV-07, RF-INV-08" />;
}
