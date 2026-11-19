// [RF-VER-06] Panel de admin. Diseño: Sebastían · acciones: Hiram.
import { ArrowLeft, ChevronRight, ExternalLink, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BannerEstatus, NOMBRE_DOCUMENTO } from "@/modules/tiendas";
import { Mapa } from "@/shared/components";
import type { EstatusVerificacion } from "@/shared/types";
import { formatoFechaHora } from "@/shared/utils";
import type { RevisionDTO, SolicitudDTO } from "../queries";
import { DecisionTienda } from "./DecisionTienda";

export const PESTANAS: { estatus: EstatusVerificacion; texto: string }[] = [
  { estatus: "PENDIENTE", texto: "Pendientes" },
  { estatus: "APROBADA", texto: "Aprobadas" },
  { estatus: "RECHAZADA", texto: "Rechazadas" },
  { estatus: "SUSPENDIDA", texto: "Suspendidas" },
];

const VACIO: Record<EstatusVerificacion, string> = {
  PENDIENTE: "No hay solicitudes pendientes. 🎉",
  APROBADA: "Todavía no hay tiendas aprobadas.",
  RECHAZADA: "No hay tiendas rechazadas.",
  SUSPENDIDA: "No hay tiendas suspendidas.",
};

export function TablaSolicitudes({ solicitudes, estatus }: { solicitudes: SolicitudDTO[]; estatus: EstatusVerificacion }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Tiendas de la colonia</h1>
        <p className="text-muted-foreground">Revisa que cada tienda exista antes de darle acceso.</p>
      </div>

      <nav aria-label="Filtrar por estatus" className="flex gap-2 overflow-x-auto pb-1">
        {PESTANAS.map((p) => {
          const activa = p.estatus === estatus;
          return (
            <Link
              key={p.estatus}
              href={`/admin/tiendas?estatus=${p.estatus}`}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center rounded-full border px-4 font-semibold transition-colors",
                activa ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {p.texto}
            </Link>
          );
        })}
      </nav>

      {solicitudes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">{VACIO[estatus]}</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {solicitudes.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/tiendas/${s.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{s.nombre}</p>
                  <p className="truncate text-muted-foreground">
                    {s.encargado} · {s.usuario.email}
                  </p>
                  <p className="text-sm text-muted-foreground">Enviada {formatoFechaHora(s.enviadaEn)}</p>
                </div>
                <ChevronRight className="size-6 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Dato({ Icono, children }: { Icono: typeof User; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3">
      <Icono className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function RevisionTienda({ tienda }: { tienda: RevisionDTO }) {
  return (
    <section className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/tiendas?estatus=${tienda.estatusVerificacion}`}>
          <ArrowLeft className="size-5" aria-hidden />
          Volver a la lista
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{tienda.nombre}</h1>
        {!tienda.usuario.emailVerified && <Badge variant="outline">Correo sin confirmar</Badge>}
      </div>

      <BannerEstatus estatus={tienda.estatusVerificacion} motivo={tienda.motivoRechazo} />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dato Icono={User}>{tienda.usuario.name}</Dato>
            <Dato Icono={Mail}>{tienda.usuario.email}</Dato>
            <Dato Icono={Phone}>{tienda.telefono}</Dato>
            <Dato Icono={MapPin}>{tienda.direccion}</Dato>
            <p className="text-sm text-muted-foreground">Enviada {formatoFechaHora(tienda.enviadaEn)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Mapa lat={tienda.lat} lng={tienda.lng} className="h-64 w-full rounded-lg border" />
            <a
              href={`https://www.openstreetmap.org/?mlat=${tienda.lat}&mlon=${tienda.lng}#map=19/${tienda.lat}/${tienda.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-4"
            >
              Ver en OpenStreetMap <ExternalLink className="size-4" aria-hidden />
            </a>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Documentos</CardTitle>
          <p className="text-sm text-muted-foreground">Cada vez que abres un documento queda registrado en la bitácora.</p>
        </CardHeader>
        <CardContent>
          {tienda.documentos.length === 0 ? (
            <p className="text-muted-foreground">La tienda no ha subido documentos.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {tienda.documentos.map((d) => (
                <li key={d.id} className="space-y-2">
                  <p className="font-semibold">{NOMBRE_DOCUMENTO[d.tipo]}</p>
                  <a href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-muted">
                    {d.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element -- documento privado servido por /api/documentos (no-store)
                      <img src={`/api/documentos/${d.id}`} alt={NOMBRE_DOCUMENTO[d.tipo]} className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-secondary">
                        <FileText className="size-12" aria-hidden />
                        Abrir PDF
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/95 p-4 backdrop-blur">
        <DecisionTienda tiendaId={tienda.id} estatus={tienda.estatusVerificacion} />
      </div>
    </section>
  );
}
