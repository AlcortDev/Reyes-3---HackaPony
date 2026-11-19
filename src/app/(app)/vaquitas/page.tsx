import { listarProductosParaVaquita, listarVaquitas, VaquitasLista } from "@/modules/vaquitas";

export default async function VaquitasPage({
  searchParams,
}: {
  searchParams?: Promise<{ productoId?: string }>;
}) {
  // El layout (app) ya validó la tienda aprobada.
  const params = searchParams ? await searchParams : undefined;
  const [vaquitas, productos] = await Promise.all([
    listarVaquitas(),
    listarProductosParaVaquita(),
  ]);
  return (
    <VaquitasLista
      vaquitas={vaquitas}
      productos={productos}
      productoInicialId={params?.productoId}
    />
  );
}
