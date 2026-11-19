import { listarTiendasPorEstatus, TablaSolicitudes } from "@/modules/admin";

export default async function AdminTiendasPage() {
  const solicitudes = await listarTiendasPorEstatus("PENDIENTE");
  return <TablaSolicitudes solicitudes={solicitudes} />;
}
