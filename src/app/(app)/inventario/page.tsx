import { getInventarioPorTienda, InventarioLista } from "@/modules/inventario";
import { requireTiendaAprobada } from "@/shared/security";

export default async function InventarioPage() {
  const { tienda } = await requireTiendaAprobada();
  const items = await getInventarioPorTienda(tienda.id);
  return <InventarioLista items={items} />;
}
