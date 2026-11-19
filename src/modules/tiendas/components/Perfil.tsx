// [RF-VER-05] Perfil y estatus de verificación. Diseño: Sebastían.
import type { EstatusVerificacion } from "@/shared/types";
import { BotonSalir } from "@/modules/auth";
import type { MiTiendaDTO } from "../queries";

const ESTATUS: Record<EstatusVerificacion, { titulo: string; texto: string; clase: string }> = {
  PENDIENTE: { titulo: "⏳ Tu tienda está en revisión", texto: "Te avisaremos por correo cuando la aprobemos.", clase: "bg-yellow-50 text-yellow-800" },
  APROBADA: { titulo: "✅ Tu tienda está aprobada", texto: "Ya puedes usar inventario y vaquitas.", clase: "bg-green-50 text-green-800" },
  RECHAZADA: { titulo: "❌ No pudimos aprobar tu tienda", texto: "Revisa el motivo y vuelve a subir tus documentos.", clase: "bg-red-50 text-red-800" },
  SUSPENDIDA: { titulo: "⛔ Tu tienda está suspendida", texto: "Contacta al administrador.", clase: "bg-gray-100 text-gray-800" },
};

export function BannerEstatus({ estatus, motivo }: { estatus: EstatusVerificacion; motivo?: string | null }) {
  const e = ESTATUS[estatus];
  return (
    <div className={`rounded-lg p-4 ${e.clase}`} role="status">
      <p className="font-bold">{e.titulo}</p>
      <p>{e.texto}</p>
      {motivo && <p className="mt-2">Motivo: {motivo}</p>}
    </div>
  );
}

export function PerfilTienda({ tienda }: { tienda: MiTiendaDTO | null }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <BotonSalir />
      </div>
      {!tienda ? (
        <p>No encontramos una tienda ligada a tu cuenta.</p>
      ) : (
        <>
          <BannerEstatus estatus={tienda.estatusVerificacion} motivo={tienda.motivoRechazo} />
          <dl className="space-y-1">
            <div><dt className="inline font-semibold">Tienda: </dt><dd className="inline">{tienda.nombre}</dd></div>
            <div><dt className="inline font-semibold">Encargado: </dt><dd className="inline">{tienda.encargado}</dd></div>
            <div><dt className="inline font-semibold">Dirección: </dt><dd className="inline">{tienda.direccion}</dd></div>
            <div><dt className="inline font-semibold">Documentos: </dt><dd className="inline">{tienda.documentos.length} de 3</dd></div>
          </dl>
          {/* TODO(Sebastían) [RF-VER-07] si está RECHAZADA: formulario para re-subir documentos → resubirDocumentos */}
        </>
      )}
    </section>
  );
}
