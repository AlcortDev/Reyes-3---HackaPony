import { notFound } from "next/navigation";
import { getVaquita } from "@/modules/vaquitas";
import { Pendiente } from "@/shared/components";

export default async function DetalleVaquitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vaquita = await getVaquita(id);
  if (!vaquita) notFound();
  // TODO(Jesús) [RF-VAQ-02…10] detalle con polling (SWR a /api/canastas/[id] cada 2 s), aportar, confeti, WhatsApp y QR
  return <Pendiente titulo={`Vaquita: ${vaquita.producto}`} dueno="Jesús" requisitos="RF-VAQ-02…10" />;
}
