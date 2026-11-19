// [RF-VER-06] Panel de admin. Diseño: Sebastían · acciones: Hiram.
import Link from "next/link";
import { formatoFechaHora } from "@/shared/utils";
import type { RevisionDTO, SolicitudDTO } from "../queries";

export function TablaSolicitudes({ solicitudes }: { solicitudes: SolicitudDTO[] }) {
  // TODO(Sebastían) pestañas por estatus (Pendientes / Aprobadas / Rechazadas)
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Solicitudes de tiendas</h1>
      {solicitudes.length === 0 && <p>No hay solicitudes pendientes. 🎉</p>}
      <ul className="space-y-2">
        {solicitudes.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/tiendas/${s.id}`} className="block rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold">{s.nombre}</p>
              <p className="text-sm text-gray-600">
                {s.encargado} · {s.usuario.email} · enviada {formatoFechaHora(s.enviadaEn)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RevisionTienda({ tienda }: { tienda: RevisionDTO }) {
  // TODO(Sebastían) mapa con el pin, visor de documentos y botones Aprobar / Rechazar (diálogo con motivo)
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">{tienda.nombre}</h1>
      <p>{tienda.direccion}</p>
      <p className="text-sm text-gray-600">
        {tienda.lat.toFixed(5)}, {tienda.lng.toFixed(5)} · estatus {tienda.estatusVerificacion}
      </p>
      <ul className="list-disc pl-6">
        {tienda.documentos.map((d) => (
          <li key={d.id}>
            {/* Cada vista registra DOC_VISTO [RNF-SEC-11] */}
            <a href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer" className="underline">
              {d.tipo}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
