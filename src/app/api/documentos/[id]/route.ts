// [RNF-SEC-09, RNF-SEC-10, RNF-SEC-11] Ver un documento de verificación: solo ADMIN o el dueño.
import { db } from "@/shared/db";
import { assertSession, datosDelRequest, NoAutorizadoError, registrarEvento } from "@/shared/security";
import { leerDocumento } from "@/shared/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let sesion: Awaited<ReturnType<typeof assertSession>>;
  try {
    sesion = await assertSession();
  } catch (e) {
    if (e instanceof NoAutorizadoError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const { id } = await params;
  const { ip, userAgent } = await datosDelRequest();
  const doc = await leerDocumento(id);
  if (!doc) return new Response("No encontrado", { status: 404 });

  const esAdmin = sesion.user.role === "ADMIN";
  const esDueno = !!(await db.tienda.findFirst({ where: { id: doc.tiendaId, usuarioId: sesion.user.id }, select: { id: true } }));
  if (!esAdmin && !esDueno) {
    await registrarEvento("DOC_VISTO", { exito: false, userId: sesion.user.id, objetivo: id, ip, userAgent });
    return new Response("No autorizado", { status: 403 });
  }

  await registrarEvento("DOC_VISTO", { exito: true, userId: sesion.user.id, objetivo: id, ip, userAgent, detalle: { tipo: doc.tipo } });
  return new Response(new Uint8Array(doc.buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
