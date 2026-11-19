import { notFound } from "next/navigation";
import { getVaquita, VaquitaDetalle } from "@/modules/vaquitas";
import { requireTiendaAprobada } from "@/shared/security";

export default async function DetalleVaquitaPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { tienda }] = await Promise.all([params, requireTiendaAprobada()]);
  const vaquita = await getVaquita(id);
  if (!vaquita) notFound();
  return (
    <VaquitaDetalle
      inicial={vaquita}
      tiendaActualId={tienda.id}
      tiendaActualNombre={tienda.nombre}
    />
  );
}
