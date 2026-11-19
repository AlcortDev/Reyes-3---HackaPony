import { notFound } from "next/navigation";
import { getTiendaParaRevision, RevisionTienda } from "@/modules/admin";

export default async function RevisionTiendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tienda = await getTiendaParaRevision(id);
  if (!tienda) notFound();
  return <RevisionTienda tienda={tienda} />;
}
