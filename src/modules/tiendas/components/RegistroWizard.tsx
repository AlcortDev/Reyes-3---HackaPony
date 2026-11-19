"use client";
// [RF-VER-01…04] Registro de tienda en 4 pasos con UN SOLO envío. Diseño: Sebastían · servidor: registrarTienda (Hiram).
// Todos los campos viven en el mismo <form> (los pasos ocultos solo se esconden), así FormData lleva todo junto.
import { ArrowLeft, ArrowRight, LocateFixed, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ZodTypeAny } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Aviso, CampoContrasena } from "@/modules/auth";
import { CENTRO_MORELIA, Mapa } from "@/shared/components";
import { registrarTienda } from "../actions";
import { CAMPOS_DOCUMENTO, pasoCuentaSchema, pasoTiendaSchema, pasoUbicacionSchema } from "../schemas";
import { SubirDocumento } from "./SubirDocumento";

const PASOS = [
  { titulo: "Tu cuenta", descripcion: "Con estos datos vas a entrar a La Vaquita." },
  { titulo: "Tu tienda", descripcion: "Así te van a reconocer las demás tiendas de la colonia." },
  { titulo: "¿Dónde está?", descripcion: "Pon el pin justo en la puerta de tu tienda." },
  { titulo: "Comprueba que tu tienda existe", descripcion: "Solo el administrador ve estos documentos y se guardan cifrados." },
] as const;

type Errores = Record<string, string | undefined>;

function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  ...props
}: { id: string; etiqueta: string; error?: string; ayuda?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {etiqueta}
      </Label>
      <Input id={id} name={id} aria-invalid={!!error} aria-describedby={error || ayuda ? `${id}-ayuda` : undefined} {...props} />
      {(error || ayuda) && (
        <p id={`${id}-ayuda`} className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}

export function RegistroWizard() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number }>(CENTRO_MORELIA);
  const [pinMovido, setPinMovido] = useState(false);
  const [gps, setGps] = useState<"inicial" | "buscando" | "error">("inicial");
  const [docsOk, setDocsOk] = useState<Record<string, boolean>>({});

  function datos(): Record<string, FormDataEntryValue> {
    return Object.fromEntries(new FormData(form.current!).entries());
  }

  function validar(schema: ZodTypeAny, extra?: (d: Record<string, FormDataEntryValue>) => Errores): boolean {
    const d = datos();
    const r = schema.safeParse(d);
    const nuevos: Errores = {};
    if (!r.success) {
      for (const issue of r.error.issues) {
        const campo = String(issue.path[0]);
        nuevos[campo] ??= issue.message;
      }
    }
    Object.assign(nuevos, extra?.(d));
    setErrores(nuevos);
    return Object.values(nuevos).every((v) => !v);
  }

  function siguiente() {
    setErrorGeneral(null);
    let valido = true;
    if (paso === 0) {
      valido = validar(pasoCuentaSchema, (d) =>
        d.password !== d.confirmar ? { confirmar: "Las contraseñas no coinciden" } : {},
      );
    } else if (paso === 1) {
      valido = validar(pasoTiendaSchema);
    } else if (paso === 2) {
      valido = validar(pasoUbicacionSchema, () => (pinMovido ? {} : { ubicacion: "Toca el mapa o usa tu ubicación para poner el pin." }));
    }
    if (valido) {
      setPaso((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function usarMiUbicacion() {
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      setGps("error");
      return;
    }
    setGps("buscando");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUbicacion({ lat: p.coords.latitude, lng: p.coords.longitude });
        setPinMovido(true);
        setGps("inicial");
        setErrores((e) => ({ ...e, ubicacion: undefined }));
      },
      () => setGps("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (paso < PASOS.length - 1) {
      siguiente();
      return;
    }
    setErrorGeneral(null);
    const d = datos();
    const nuevos: Errores = {};
    for (const campo of Object.values(CAMPOS_DOCUMENTO)) {
      if (!docsOk[campo]) nuevos[campo] = "Falta este documento o no es válido.";
    }
    if (d.aceptaPrivacidad !== "on") nuevos.aceptaPrivacidad = "Necesitamos que aceptes el aviso de privacidad.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    const r = await registrarTienda(new FormData(form.current!));
    setEnviando(false);
    if (!r.ok) {
      setErrorGeneral(r.error);
      return;
    }
    router.push(`/verificar-correo?email=${encodeURIComponent(String(d.email ?? ""))}`);
  }

  const marcarDoc = (campo: string) => (ok: boolean) => {
    setDocsOk((prev) => ({ ...prev, [campo]: ok }));
    if (ok) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>
            Paso {paso + 1} de {PASOS.length}
          </span>
          <Link href="/login" className="text-primary underline underline-offset-4">
            Ya tengo cuenta
          </Link>
        </div>
        <Progress value={((paso + 1) / PASOS.length) * 100} aria-label={`Paso ${paso + 1} de ${PASOS.length}`} />
        <CardTitle className="text-2xl">{PASOS[paso].titulo}</CardTitle>
        <CardDescription className="text-base">{PASOS[paso].descripcion}</CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={form} onSubmit={enviar} noValidate className="space-y-5">
          {/* Paso 1 · Cuenta */}
          <fieldset className={cn("space-y-5", paso !== 0 && "hidden")}>
            <legend className="sr-only">Tu cuenta</legend>
            <Campo id="nombre" etiqueta="Tu nombre" autoComplete="name" maxLength={80} error={errores.nombre} />
            <Campo id="email" etiqueta="Correo" type="email" inputMode="email" autoComplete="email" maxLength={254} error={errores.email} />
            <CampoContrasena
              id="password"
              name="password"
              etiqueta="Contraseña"
              autoComplete="new-password"
              ayuda="Mínimo 12 caracteres. Tip: usa una frase, como «tienda de la esquina 2026»."
              error={errores.password}
            />
            <CampoContrasena id="confirmar" name="confirmar" etiqueta="Escríbela otra vez" autoComplete="new-password" error={errores.confirmar} />
          </fieldset>

          {/* Paso 2 · Tienda */}
          <fieldset className={cn("space-y-5", paso !== 1 && "hidden")}>
            <legend className="sr-only">Tu tienda</legend>
            <Campo id="nombreTienda" etiqueta="Nombre de la tienda" placeholder="Ej. Abarrotes Doña Lupe" maxLength={80} error={errores.nombreTienda} />
            <Campo
              id="direccion"
              etiqueta="Dirección"
              placeholder="Calle, número y colonia"
              autoComplete="street-address"
              maxLength={200}
              error={errores.direccion}
            />
            <Campo
              id="telefono"
              etiqueta="Teléfono (WhatsApp)"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10 dígitos"
              maxLength={10}
              error={errores.telefono}
              onChange={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
              }}
            />
          </fieldset>

          {/* Paso 3 · Ubicación */}
          <fieldset className={cn("space-y-4", paso !== 2 && "hidden")}>
            <legend className="sr-only">Ubicación de la tienda</legend>
            <Button type="button" variant="secondary" className="w-full" onClick={usarMiUbicacion} disabled={gps === "buscando"}>
              <LocateFixed className="size-5" aria-hidden />
              {gps === "buscando" ? "Buscando…" : "Usar mi ubicación"}
            </Button>
            {gps === "error" && (
              <Aviso tipo="info">No pudimos usar tu ubicación. No pasa nada: toca el mapa en la puerta de tu tienda.</Aviso>
            )}
            {paso === 2 && (
              <Mapa
                lat={ubicacion.lat}
                lng={ubicacion.lng}
                onCambio={(lat, lng) => {
                  setUbicacion({ lat, lng });
                  setPinMovido(true);
                  setErrores((e) => ({ ...e, ubicacion: undefined }));
                }}
              />
            )}
            <p className="text-sm text-muted-foreground">Puedes arrastrar el pin o tocar el mapa para moverlo.</p>
            {errores.ubicacion && <Aviso tipo="error">{errores.ubicacion}</Aviso>}
            <input type="hidden" name="lat" value={ubicacion.lat} readOnly />
            <input type="hidden" name="lng" value={ubicacion.lng} readOnly />
          </fieldset>

          {/* Paso 4 · Documentos */}
          <fieldset className={cn("space-y-6", paso !== 3 && "hidden")}>
            <legend className="sr-only">Documentos</legend>
            <SubirDocumento
              name={CAMPOS_DOCUMENTO.FACHADA}
              titulo="📸 Foto de la fachada"
              descripcion="Que se vea la entrada y, si tienes, el letrero."
              soloImagen
              camara
              error={errores[CAMPOS_DOCUMENTO.FACHADA]}
              onValidez={marcarDoc(CAMPOS_DOCUMENTO.FACHADA)}
            />
            <SubirDocumento
              name={CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO}
              titulo="🧾 Comprobante de domicilio"
              descripcion="Recibo de luz, agua o predial de los últimos 3 meses. Foto o PDF."
              error={errores[CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO]}
              onValidez={marcarDoc(CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO)}
            />
            <SubirDocumento
              name={CAMPOS_DOCUMENTO.IDENTIFICACION}
              titulo="🪪 Identificación oficial (INE)"
              descripcion="Del dueño de la tienda, por el frente. Foto o PDF."
              error={errores[CAMPOS_DOCUMENTO.IDENTIFICACION]}
              onValidez={marcarDoc(CAMPOS_DOCUMENTO.IDENTIFICACION)}
            />

            <div className="flex items-start gap-3 rounded-lg border bg-secondary/50 p-4">
              <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <p className="text-sm">
                Tus documentos se guardan <strong>cifrados</strong>, solo los ve el administrador para confirmar que tu tienda existe, y nunca
                se comparten con otras tiendas.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="aceptaPrivacidad" className="mt-1 size-6 shrink-0 accent-[var(--primary)]" aria-invalid={!!errores.aceptaPrivacidad} />
              <span className="text-base">
                Leí y acepto el{" "}
                <Link href="/privacidad" target="_blank" className="text-primary underline underline-offset-4">
                  aviso de privacidad
                </Link>
                .
              </span>
            </label>
            {errores.aceptaPrivacidad && <p className="text-sm text-destructive">{errores.aceptaPrivacidad}</p>}
          </fieldset>

          {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

          <div className="flex gap-3 pt-2">
            {paso > 0 && (
              <Button type="button" variant="outline" size="lg" onClick={() => setPaso((p) => p - 1)} disabled={enviando}>
                <ArrowLeft className="size-5" aria-hidden />
                Atrás
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={enviando}>
              {paso < PASOS.length - 1 ? (
                <>
                  Siguiente <ArrowRight className="size-5" aria-hidden />
                </>
              ) : enviando ? (
                "Enviando…"
              ) : (
                "Registrar mi tienda"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

