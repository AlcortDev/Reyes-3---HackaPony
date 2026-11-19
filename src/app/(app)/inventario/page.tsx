import { getInventarioPorTienda, getProductosParaAgregar, InventarioLista } from "@/modules/inventario";
import { requireTiendaAprobada } from "@/shared/security";

export default async function InventarioPage() {
  const { tienda } = await requireTiendaAprobada();
  const [items, catalogo] = await Promise.all([getInventarioPorTienda(tienda.id), getProductosParaAgregar(tienda.id)]);
  return <InventarioLista items={items} catalogo={catalogo} />;
}
