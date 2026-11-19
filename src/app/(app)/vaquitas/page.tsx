import { getProductosBajoStock } from "@/modules/inventario";
import { listarProductosParaVaquita, listarVaquitas, VaquitasLista } from "@/modules/vaquitas";
import { requireTiendaAprobada } from "@/shared/security";

export default async function VaquitasPage({
  searchParams,
}: {
  searchParams?: Promise<{ productoId?: string }>;
}) {
  const [{ tienda }, params] = await Promise.all([
    requireTiendaAprobada(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);

  const [vaquitas, productos, bajoStock] = await Promise.all([
    listarVaquitas(),
    listarProductosParaVaquita(),
    getProductosBajoStock(tienda.id),
  ]);

  return (
    <VaquitasLista
      vaquitas={vaquitas}
      productos={productos}
      productoInicialId={params?.productoId}
      productosBajoStock={bajoStock}
    />
  );
}
