import { listarTiendasPorEstatus, PESTANAS, TablaSolicitudes } from "@/modules/admin";
import type { EstatusVerificacion } from "@/shared/types";

export default async function AdminTiendasPage({ searchParams }: { searchParams: Promise<{ estatus?: string }> }) {
  const { estatus: param } = await searchParams;
  // Solo valores de la lista blanca (nunca se pasa el parámetro crudo a la BD)
  const estatus: EstatusVerificacion = PESTANAS.find((p) => p.estatus === param)?.estatus ?? "PENDIENTE";
  const solicitudes = await listarTiendasPorEstatus(estatus);
  return <TablaSolicitudes solicitudes={solicitudes} estatus={estatus} />;
}
