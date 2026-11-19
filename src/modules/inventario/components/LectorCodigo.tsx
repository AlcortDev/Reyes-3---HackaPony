"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanBarcode, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { buscarInventarioPorCodigo } from "../codigos";
import { capturaVigente, detenerStream } from "../camara";
import estilos from "./inventario.module.css";

/** [RF-INV-10] Leer nunca registra una venta: abre el producto para elegir la acción. */
export function LectorCodigo({ bloqueado, onAbiertoChange }: { bloqueado: boolean; onAbiertoChange: (abierto: boolean) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [apertura, setApertura] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [fase, setFase] = useState<"listo" | "iniciando" | "camara" | "buscando" | "deteniendo">("listo");
  const [error, setError] = useState<string | null>(null);
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
    setFase("buscando"); setError(null);
    try {
      detener();
      const resultado = await buscarInventarioPorCodigo(valor);
      if (intento !== generacion.current) return;
      if (resultado.ok) router.push(`/inventario/${encodeURIComponent(resultado.data.inventarioId)}`);
      else setError(resultado.error);
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
    ocupado.current = false; setFase("listo"); setError(null); setAbierto(false); onAbiertoChange(false);
  }

  if (!abierto) return <button type="button" className={estilos.botonSecundario} disabled={bloqueado}
    aria-expanded={false} onClick={() => {
      generacion.current++; setApertura(a => a + 1); setAbierto(true); onAbiertoChange(true);
    }}>
    <ScanBarcode aria-hidden="true" size={20} /> Buscar por código
  </button>;

  return (
    <section className={estilos.lector} aria-label="Buscar producto por código">
      <div className={estilos.lectorTitulo}>
        <h2>Buscar por código</h2>
        <button type="button" aria-label="Cerrar lector" className={estilos.cerrarLector} onClick={cerrar}><X aria-hidden="true" size={20} /></button>
      </div>
      <p>Escanea o escribe el código. Después elige vender o surtir.</p>
      <form className={estilos.formCantidad} onSubmit={event => { event.preventDefault(); void buscar(codigo); }}>
        <label htmlFor={`${id}-codigo`}>Código de barras</label>
        <input id={`${id}-codigo`} name="codigo" autoComplete="off" maxLength={128} required value={codigo}
          disabled={fase !== "listo" || bloqueado} onChange={event => setCodigo(event.target.value)} />
        <button type="submit" className={estilos.botonPrimario} disabled={fase !== "listo" || bloqueado}>
          {fase === "buscando" ? "Buscando…" : "Buscar producto"}
        </button>
      </form>
      <video ref={video} className={estilos.videoLector} muted playsInline hidden={fase !== "camara" && fase !== "iniciando"} />
      <div id={id} className={estilos.decodificador} aria-hidden="true" />
      {fase === "camara" ? <button type="button" className={estilos.botonSecundario}
        onClick={() => { void detenerCamara().catch(() => {}); }}>Detener cámara</button>
        : <button type="button" className={estilos.botonSecundario} disabled={fase !== "listo" || bloqueado} onClick={() => void iniciarCamara()}>
          <Camera aria-hidden="true" size={20} />{fase === "iniciando" ? "Abriendo cámara…" : "Usar cámara"}
        </button>}
      {error && <p role="alert" className={estilos.critico}>{error}</p>}
    </section>
  );
}
