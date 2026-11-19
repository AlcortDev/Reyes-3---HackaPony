"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanBarcode, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { buscarInventarioPorCodigo } from "../codigos";
import { capturaVigente, detenerStream } from "../camara";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** [RF-INV-10] Leer nunca registra una venta: abre el producto para elegir la acción. */
export function LectorCodigo({ bloqueado, onAbiertoChange, onNoEncontrado }: {
  bloqueado: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  /** [RF-INV-11] El código no está en el inventario: ofrecer agregarlo. */
  onNoEncontrado?: (codigo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [apertura, setApertura] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [fase, setFase] = useState<"listo" | "iniciando" | "camara" | "buscando" | "deteniendo">("listo");
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState<string | null>(null);
  const lector = useRef<Html5Qrcode | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);
  const generacion = useRef(0);
  const ocupado = useRef(false);
  const router = useRouter();
  const id = `lector-${useId().replace(/:/g, "")}-${apertura}`;

  useEffect(() => () => {
    generacion.current++;
    if (temporizador.current) clearInterval(temporizador.current);
    detenerStream(stream.current); stream.current = null;
    try { lector.current?.clear(); } catch { /* Ya desmontado. */ }
    lector.current = null;
    onAbiertoChange(false);
  }, [onAbiertoChange]);

  function detener() {
    if (temporizador.current) clearInterval(temporizador.current);
    temporizador.current = null;
    detenerStream(stream.current); stream.current = null;
    if (video.current) video.current.srcObject = null;
    try { lector.current?.clear(); } catch { /* Captura de imagen ya cancelada. */ }
    lector.current = null;
  }

  async function buscar(valor: string) {
    if (ocupado.current || bloqueado) return;
    ocupado.current = true;
    const intento = generacion.current;
    setFase("buscando"); setError(null); setNoEncontrado(null);
    try {
      detener();
      const resultado = await buscarInventarioPorCodigo(valor);
      if (intento !== generacion.current) return;
      if (resultado.ok) router.push(`/inventario/${encodeURIComponent(resultado.data.inventarioId)}`);
      else { setError(resultado.error); setNoEncontrado(valor.trim()); }
    } catch {
      if (intento === generacion.current) setError("No pudimos buscar el producto. Intenta de nuevo.");
    } finally {
      if (intento === generacion.current) { ocupado.current = false; setFase("listo"); }
    }
  }

  async function iniciarCamara() {
    if (ocupado.current || bloqueado) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Para usar la cámara, abre la app mediante HTTPS. También puedes escribir el código."); return;
    }
    ocupado.current = true;
    const intento = generacion.current;
    setFase("iniciando"); setError(null);
    let propio: MediaStream | null = null;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats: F } = await import("html5-qrcode");
      if (intento !== generacion.current) return;
      propio = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
      if (intento !== generacion.current || !video.current) { detenerStream(propio); return; }
      const superficie = video.current;
      stream.current = propio; superficie.srcObject = propio;
      await superficie.play(); // La cancelación se captura aquí, antes de decodificar.
      if (!capturaVigente(intento, generacion.current, propio, stream.current)) { detenerStream(propio); return; }
      const actual = new Html5Qrcode(id, {
        verbose: false, formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39],
      });
      lector.current = actual;
      const captura = document.createElement("canvas");
      let leyendo = false;
      temporizador.current = setInterval(async () => {
        if (leyendo || ocupado.current || !propio || !capturaVigente(intento, generacion.current, propio, stream.current)) return;
        leyendo = true;
        try {
          captura.width = superficie.videoWidth; captura.height = superficie.videoHeight;
          captura.getContext("2d")?.drawImage(superficie, 0, 0);
          const blob = await new Promise<Blob | null>(resolve => captura.toBlob(resolve, "image/jpeg", .9));
          if (!blob) return;
          const resultado = await actual.scanFileV2(new File([blob], "captura.jpg", { type: "image/jpeg" }), false);
          if (propio && capturaVigente(intento, generacion.current, propio, stream.current)) void buscar(resultado.decodedText);
        } catch { /* Un cuadro sin código se reintenta; la imagen permanece en el dispositivo. */ }
        finally { leyendo = false; }
      }, 350);
      setFase("camara");
    } catch {
      detenerStream(propio);
      if (intento === generacion.current) {
        detener();
        setError("No pudimos abrir la cámara. Revisa el permiso o escribe el código.");
        setFase("listo");
      }
    } finally {
      if (intento === generacion.current) ocupado.current = false;
    }
  }

  async function detenerCamara() {
    const intento = ++generacion.current;
    ocupado.current = true; setFase("deteniendo");
    try { detener(); } finally {
      if (intento === generacion.current) { ocupado.current = false; setFase("listo"); }
    }
  }

  function cerrar() {
    generacion.current++;
    detener();
    ocupado.current = false; setFase("listo"); setError(null); setNoEncontrado(null); setAbierto(false); onAbiertoChange(false);
  }

  if (!abierto) return <Button type="button" variant="outline" disabled={bloqueado}
    aria-expanded={false} onClick={() => {
      generacion.current++; setApertura(a => a + 1); setAbierto(true); onAbiertoChange(true);
    }}>
    <ScanBarcode aria-hidden="true" data-icon="inline-start" /> Buscar por código
  </Button>;

  return (
    <section aria-label="Buscar producto por código">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle><h2 className="text-lg font-bold">Buscar por código</h2></CardTitle>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar lector" onClick={cerrar}><X aria-hidden="true" /></Button>
          </div>
          <CardDescription>Escanea o escribe el código. Después elige vender o surtir.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); void buscar(codigo); }}>
            <FieldGroup>
              <Field data-disabled={fase !== "listo" || bloqueado}>
                <FieldLabel htmlFor={`${id}-codigo`}>Código de barras</FieldLabel>
                <Input id={`${id}-codigo`} name="codigo" autoComplete="off" maxLength={128} required value={codigo}
                  disabled={fase !== "listo" || bloqueado} onChange={event => setCodigo(event.target.value)} />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={fase !== "listo" || bloqueado}>
              {fase === "buscando" ? "Buscando…" : "Buscar producto"}
            </Button>
          </form>
          <video ref={video} className="max-h-60 w-full rounded-lg object-cover" muted playsInline hidden={fase !== "camara" && fase !== "iniciando"} />
          <div id={id} className="hidden" aria-hidden="true" />
          {fase === "camara" ? <Button type="button" variant="outline"
            onClick={() => { void detenerCamara().catch(() => {}); }}>Detener cámara</Button>
            : <Button type="button" variant="outline" disabled={fase !== "listo" || bloqueado} onClick={() => void iniciarCamara()}>
              <Camera aria-hidden="true" data-icon="inline-start" />{fase === "iniciando" ? "Abriendo cámara…" : "Usar cámara"}
            </Button>}
          {error && <Alert variant="destructive"><AlertTitle>{error}</AlertTitle></Alert>}
          {noEncontrado && onNoEncontrado && fase === "listo" && (
            <Button type="button" onClick={() => { const c = noEncontrado; cerrar(); onNoEncontrado(c); }}>
              Agregarlo a mi inventario
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
