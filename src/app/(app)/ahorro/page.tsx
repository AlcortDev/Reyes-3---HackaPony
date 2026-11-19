import { getResumenAhorroColonia, getResumenAhorroTienda, ResumenAhorro } from "@/modules/ahorro";
import { requireTiendaAprobada } from "@/shared/security";

export default async function AhorroPage() {
  const { tienda } = await requireTiendaAprobada();
  const [resumen, colonia] = await Promise.all([
    getResumenAhorroTienda(tienda.id),
    getResumenAhorroColonia(),
  ]);
  return <ResumenAhorro resumen={resumen} colonia={colonia} nombreTienda={tienda.nombre} />;
}
