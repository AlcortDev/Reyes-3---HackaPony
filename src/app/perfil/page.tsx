// [RF-VER-05] Única página disponible mientras la tienda no esté APROBADA.
import { getMiTienda, PerfilTienda } from "@/modules/tiendas";
import { requireSession } from "@/shared/security";

export default async function PerfilPage() {
  await requireSession();
  const tienda = await getMiTienda();
  return <PerfilTienda tienda={tienda} />;
}
