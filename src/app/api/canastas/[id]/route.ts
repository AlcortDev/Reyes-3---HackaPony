// [RF-VAQ-05] Polling de una vaquita (SRS §6.2). Dueño: Jesús.
import { NextResponse } from "next/server";
import { getVaquita } from "@/modules/vaquitas";
import { assertTiendaAprobada, NoAutorizadoError } from "@/shared/security";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertTiendaAprobada();
  } catch (e) {
    if (e instanceof NoAutorizadoError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { id } = await params;
  const vaquita = await getVaquita(id);
  if (!vaquita) return NextResponse.json({ error: "Vaquita no encontrada" }, { status: 404 });
  return NextResponse.json(vaquita, { headers: { "Cache-Control": "no-store" } });
}
