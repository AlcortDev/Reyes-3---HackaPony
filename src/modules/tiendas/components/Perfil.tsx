// [RF-VER-05, RF-VER-07] Perfil y estatus de verificación. Diseño: Sebastían.
import { Ban, CheckCircle2, Clock, FileText, MapPin, Phone, User, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BotonSalir } from "@/modules/auth";
import { Logo } from "@/shared/components";
import type { EstatusVerificacion, TipoDocumento } from "@/shared/types";
import type { MiTiendaDTO } from "../queries";
import { ResubirDocumentos } from "./ResubirDocumentos";

const ESTATUS: Record<EstatusVerificacion, { titulo: string; texto: string; clase: string; Icono: typeof Clock }> = {
  PENDIENTE: {
    titulo: "Tu tienda está en revisión",
    texto: "Estamos revisando tus documentos. Te avisamos por correo en cuanto la aprobemos.",
    clase: "border-accent bg-accent/40 text-accent-foreground",
    Icono: Clock,
  },
  APROBADA: {
    titulo: "¡Tu tienda está aprobada!",
    texto: "Ya puedes usar tu inventario y entrarle a las vaquitas.",
    clase: "border-primary/30 bg-secondary text-secondary-foreground",
    Icono: CheckCircle2,
  },
  RECHAZADA: {
    titulo: "No pudimos aprobar tu tienda",
    texto: "Revisa el motivo y vuelve a subir tus documentos aquí abajo.",
    clase: "border-destructive/30 bg-destructive/10 text-destructive",
    Icono: XCircle,
  },
  SUSPENDIDA: {
    titulo: "Tu tienda está suspendida",
    texto: "Por ahora no puedes usar La Vaquita. Escríbenos para revisarlo.",
    clase: "border-border bg-muted text-foreground",
    Icono: Ban,
  },
};

export const NOMBRE_DOCUMENTO: Record<TipoDocumento, string> = {
  FACHADA: "Foto de la fachada",
  COMPROBANTE_DOMICILIO: "Comprobante de domicilio",
  IDENTIFICACION: "Identificación oficial",
};

export function BannerEstatus({ estatus, motivo }: { estatus: EstatusVerificacion; motivo?: string | null }) {
  const e = ESTATUS[estatus];
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4", e.clase)} role="status">
      <e.Icono className="mt-0.5 size-7 shrink-0" aria-hidden />
      <div>
        <p className="text-lg font-bold">{e.titulo}</p>
        <p>{e.texto}</p>
        {motivo && (
          <p className="mt-2 rounded-md bg-card/70 p-2 text-foreground">
            <strong>Motivo:</strong> {motivo}
          </p>
        )}
      </div>
    </div>
  );
}

function Dato({ Icono, etiqueta, valor }: { Icono: typeof User; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icono className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
        <dd className="font-semibold">{valor}</dd>
      </div>
    </div>
  );
}

export function PerfilTienda({ tienda }: { tienda: MiTiendaDTO | null }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Logo />
        <BotonSalir />
      </header>

      {!tienda ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Falta verificar tu tienda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Para usar el inventario y las vaquitas, mándanos los datos de tu tienda, su ubicación y tus documentos. Un administrador la revisa.</p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/verificar-tienda">Verificar mi tienda</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <BannerEstatus estatus={tienda.estatusVerificacion} motivo={tienda.motivoRechazo} />

          {tienda.estatusVerificacion === "APROBADA" && (
            <Button asChild size="lg" className="w-full">
              <Link href="/inventario">Ir a mi inventario</Link>
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🏪 {tienda.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Dato Icono={User} etiqueta="Encargado(a)" valor={tienda.encargado} />
                <Dato Icono={MapPin} etiqueta="Dirección" valor={tienda.direccion} />
                <Dato Icono={Phone} etiqueta="Teléfono" valor={tienda.telefono} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Documentos enviados</CardTitle>
            </CardHeader>
            <CardContent>
              {tienda.documentos.length === 0 ? (
                <p className="text-muted-foreground">Todavía no hay documentos.</p>
              ) : (
                <ul className="space-y-2">
                  {tienda.documentos.map((d) => (
                    <li key={d.id}>
                      <a
                        href={`/api/documentos/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-muted"
                      >
                        <FileText className="size-5 text-primary" aria-hidden />
                        <span className="underline underline-offset-4">{NOMBRE_DOCUMENTO[d.tipo]}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {tienda.estatusVerificacion === "RECHAZADA" && <ResubirDocumentos />}
        </>
      )}
    </div>
  );
}
