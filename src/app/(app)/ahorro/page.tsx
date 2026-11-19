import { getResumenAhorroTienda, ResumenAhorro } from "@/modules/ahorro";
import { requireTiendaAprobada } from "@/shared/security";

export default async function AhorroPage() {
  const { tienda } = await requireTiendaAprobada();
  const resumen = await getResumenAhorroTienda(tienda.id);
  return <ResumenAhorro resumen={resumen} />;
}
