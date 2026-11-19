"use client";
// [RF-VAQ-02…12] Detalle de vaquita con polling SWR (2 s), aportaciones, confeti, cuenta regresiva, WhatsApp y QR.
// Dueño: Jesús.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { formatoFechaHora, formatoMoneda } from "@/shared/utils";
import { aportarAVaquita, recibirPedidoVaquita } from "../actions";
import { construirMensajeWhatsApp, estadoEfectivo, tiempoRestante } from "../logic";
import type { VaquitaDetalleDTO } from "../types";
import { QrVaquita } from "./QrVaquita";
import { BarraVaquita } from "./VaquitasLista";

const COLORES_TIENDA = [
  "bg-emerald-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-purple-600",
  "bg-rose-600",
] as const;

function esHostLocal(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

/** Origen para el QR y WhatsApp: el de la barra del navegador, salvo que sea localhost y haya una URL pública configurada. */
function origenParaCompartir(): string {
  const actual = window.location.origin;
  const configurado = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (!esHostLocal(window.location.hostname) || !configurado) return actual;
  try {
    return esHostLocal(new URL(configurado).hostname) ? actual : configurado;
  } catch {
    return actual;
  }
}

const fetcher = async (url: string): Promise<VaquitaDetalleDTO> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo actualizar la vaquita");
  return res.json();
};

function ConfetiCelebracion({ activo }: { activo: boolean }) {
  if (!activo) return null;
  const piezas = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    top: `${(i * 19) % 85}%`,
    delay: `${(i % 7) * 0.15}s`,
    duration: `${1.8 + (i % 5) * 0.35}s`,
    emoji: ["🎉", "🐄", "💸", "✨", "🥳", "🟢"][i % 6],
  }));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {piezas.map((p) => (
        <span
          key={p.id}
          className="absolute animate-bounce text-2xl"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

export function VaquitaDetalle({
  inicial,
  tiendaActualId,
  tiendaActualNombre,
  yaRecibidoInicial = false,
}: {
  inicial: VaquitaDetalleDTO;
  tiendaActualId?: string;
  tiendaActualNombre?: string;
  yaRecibidoInicial?: boolean;
}) {
  // [RF-VAQ-05] Polling cada 2 segundos para ver subir la barra en tiempo real desde otro dispositivo
  const { data, mutate, isValidating } = useSWR<VaquitaDetalleDTO>(
    `/api/canastas/${inicial.id}`,
    fetcher,
    {
      fallbackData: inicial,
      refreshInterval: 2000,
      revalidateOnFocus: true,
    },
  );

  const vaquita = data ?? inicial;

  // Reloj cada 1 s para la cuenta regresiva [RF-VAQ-08]
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const estadoReal = estadoEfectivo(
    vaquita.estado,
    new Date(vaquita.cierraEn),
    vaquita.totalAportado,
    vaquita.metaUnidades,
    ahora,
  );
  const restante = tiempoRestante(vaquita.cierraEn, ahora);

  // [RF-VAQ-07] Celebración con confeti cuando la vaquita está COMPLETA
  const [mostrarConfeti, setMostrarConfeti] = useState(estadoReal === "COMPLETA");
  const estadoPrevioRef = useRef(estadoReal);

  useEffect(() => {
    if (estadoPrevioRef.current !== "COMPLETA" && estadoReal === "COMPLETA") {
      setMostrarConfeti(true);
    }
    estadoPrevioRef.current = estadoReal;
  }, [estadoReal]);

  useEffect(() => {
    if (!mostrarConfeti) return;
    const timer = setTimeout(() => setMostrarConfeti(false), 5500);
    return () => clearTimeout(timer);
  }, [mostrarConfeti]);

  // Cantidad por aportar: por defecto min(10, faltan) [CU-04]. Se maneja como string para permitir borrar en móvil.
  const sugerida = Math.max(1, Math.min(10, vaquita.faltan || 1));
  const [cantidadTexto, setCantidadTexto] = useState<string>(String(sugerida));
  const cantidad = useMemo(() => {
    const parsed = Number.parseInt(cantidadTexto, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    if (vaquita.faltan > 0 && parsed > vaquita.faltan) return vaquita.faltan;
    return parsed;
  }, [cantidadTexto, vaquita.faltan]);

  const fijarCantidad = (n: number) => {
    const clamped = Math.max(1, vaquita.faltan > 0 ? Math.min(vaquita.faltan, n) : n);
    setCantidadTexto(String(clamped));
  };

  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [yaRecibido, setYaRecibido] = useState(yaRecibidoInicial);
  const [pedidoRecibido, setPedidoRecibido] = useState<{ unidades: number; stock: number } | null>(null);
  const [mostrarQr, setMostrarQr] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [isPending, startTransition] = useTransition();
  const aportandoRef = useRef(false);
  const recibiendoRef = useRef(false);

  // Ajustar cantidad si por polling baja el número de faltantes
  useEffect(() => {
    const parsed = Number.parseInt(cantidadTexto, 10);
    if (vaquita.faltan > 0 && Number.isFinite(parsed) && parsed > vaquita.faltan) {
      setCantidadTexto(String(vaquita.faltan));
    }
  }, [vaquita.faltan, cantidadTexto]);

  // [RF-VAQ-10] El QR debe abrir en el celular del jurado: si quien presenta está en localhost,
  // usamos NEXT_PUBLIC_APP_URL (la IP de la laptop en la red local).
  const [urlActual, setUrlActual] = useState(`http://localhost:3000/vaquitas/${vaquita.id}`);
  const [qrApuntaALocal, setQrApuntaALocal] = useState(false);
  useEffect(() => {
    const origen = origenParaCompartir();
    setUrlActual(`${origen}/vaquitas/${vaquita.id}`);
    setQrApuntaALocal(esHostLocal(new URL(origen).hostname));
  }, [vaquita.id]);

  const ahorroPorPieza = Math.max(0, Math.round((vaquita.precioMenudeo - vaquita.precioMayoreo) * 100) / 100);
  const ahorroDeEstaAportacion = Math.round(ahorroPorPieza * cantidad * 100) / 100;
  const ahorroTotalColonia = Math.round(ahorroPorPieza * vaquita.metaUnidades * 100) / 100;

  const miAportacionActual = useMemo(() => {
    if (!tiendaActualId) return 0;
    return vaquita.aportaciones.find((a) => a.tiendaId === tiendaActualId)?.cantidad ?? 0;
  }, [vaquita.aportaciones, tiendaActualId]);

  const puntoEntrega = vaquita.aportaciones[0]?.tienda ?? tiendaActualNombre ?? "Abarrotes Doña Lupe (Chapultepec Norte)";

  const urlWhatsApp = useMemo(() => {
    const texto = construirMensajeWhatsApp(vaquita, urlActual);
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }, [vaquita, urlActual]);

  const handleAportar = (cantidadAportar: number) => {
    if (aportandoRef.current) return;
    setMensajeError(null);
    setMensajeExito(null);

    if (!Number.isInteger(cantidadAportar) || cantidadAportar < 1) {
      setMensajeError("La cantidad debe ser al menos 1 unidad");
      return;
    }

    aportandoRef.current = true;
    startTransition(async () => {
      try {
        const res = await aportarAVaquita({
          canastaId: vaquita.id,
          cantidad: cantidadAportar,
        });

        if (!res.ok) {
          setMensajeError(res.error);
          await mutate();
          return;
        }

        if (res.data.estado === "COMPLETA") {
          setMostrarConfeti(true);
          setMensajeExito("🎉 ¡Meta completada! Desbloqueaste el precio de mayoreo para toda la colonia.");
        } else {
          setMensajeExito(`✅ ¡Le entraste con ${cantidadAportar} ${vaquita.unidad ?? "unidades"}!`);
        }
        await mutate();
      } finally {
        aportandoRef.current = false;
      }
    });
  };

  const handleRecibirPedido = () => {
    if (recibiendoRef.current || yaRecibido) return;
    recibiendoRef.current = true;
    setMensajeError(null);
    startTransition(async () => {
      try {
        const res = await recibirPedidoVaquita({ canastaId: vaquita.id });
        if (!res.ok) {
          setMensajeError(res.error);
          return;
        }
        setYaRecibido(true);
        setPedidoRecibido({ unidades: res.data.unidadesRecibidas, stock: res.data.nuevoStock });
      } finally {
        recibiendoRef.current = false;
      }
    });
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlActual);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <section className="space-y-4">
      <ConfetiCelebracion activo={mostrarConfeti} />

      {/* Navegación superior + indicador de tiempo real [RF-VAQ-05] */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/vaquitas"
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-2xs"
        >
          ← Todas las vaquitas
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 border border-green-200">
          <span className={`h-2 w-2 rounded-full ${isValidating ? "bg-amber-500 animate-ping" : "bg-green-600"}`} />
          Tiempo real (2 s)
        </span>
      </div>

      {/* Banner de celebración cuando se alcanza el 100% [RF-VAQ-07] */}
      {estadoReal === "COMPLETA" && (
        <div
          role="status"
          className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 text-center shadow-sm"
        >
          <p className="text-3xl">🎉🐄🎉</p>
          <h2 className="mt-1 text-xl font-extrabold text-emerald-950">
            ¡Precio de mayoreo desbloqueado!
          </h2>
          <p className="mt-1 text-sm text-emerald-900">
            La colonia juntó las <strong>{vaquita.metaUnidades}</strong> unidades y ahorró{" "}
            <strong>{formatoMoneda(ahorroTotalColonia)}</strong> en total.
          </p>
          {miAportacionActual > 0 && (
            <p className="mt-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-bold text-emerald-800">
              💰 Tu tienda aportó {miAportacionActual} y ahorró{" "}
              {formatoMoneda(miAportacionActual * ahorroPorPieza)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarConfeti(true)}
              className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-xs"
            >
              🎉 Celebrar otra vez
            </button>
            <Link
              href="/ahorro"
              className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 bg-white px-4 py-2 text-sm font-bold text-emerald-800"
            >
              💰 Ver mi ahorro acumulado →
            </Link>
          </div>

          {/* [RF-VAQ-11 · COULD] Recibir pedido directamente en inventario */}
          {miAportacionActual > 0 && (
            <div className="mt-3 border-t border-emerald-200 pt-3">
              {pedidoRecibido ? (
                <p className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white">
                  ✅ ¡Sumaste +{pedidoRecibido.unidades} {vaquita.unidad ?? "unidades"} a tu inventario! (Stock actual:{" "}
                  {pedidoRecibido.stock})
                </p>
              ) : yaRecibido ? (
                <p className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900">
                  📦 Ya ingresaste estas {miAportacionActual} {vaquita.unidad ?? "unidades"} a tu inventario.
                </p>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleRecibirPedido}
                  className="min-h-11 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-xs disabled:opacity-50"
                >
                  📥 Recibir mis {miAportacionActual} {vaquita.unidad ?? "unidades"} en mi inventario
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner si la vaquita cerró sin completar [RN-08] */}
      {estadoReal === "CERRADA" && (
        <div role="status" className="rounded-xl border border-gray-300 bg-gray-100 p-4 text-center">
          <p className="text-lg font-bold text-gray-800">🔒 Esta vaquita ya cerró</p>
          <p className="text-sm text-gray-600">
            Venció el plazo sin alcanzar las {vaquita.metaUnidades} unidades requeridas.
          </p>
        </div>
      )}

      {/* Tarjeta principal del producto y progreso */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-green-700">
              Pedido Grupal · {vaquita.proveedor}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900">🐄 {vaquita.producto}</h1>
          </div>
          {estadoReal === "ABIERTA" && (
            <span
              suppressHydrationWarning
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                restante.urgente ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"
              }`}
            >
              ⏱️ Cierra en {restante.texto}
            </span>
          )}
        </div>

        {/* Precios Menudeo vs Mayoreo */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Menudeo</p>
            <p className="text-base font-semibold text-gray-500 line-through">
              {formatoMoneda(vaquita.precioMenudeo)}
            </p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-xs font-semibold text-green-800">Mayoreo vaquita</p>
            <p className="text-xl font-extrabold text-green-700">{formatoMoneda(vaquita.precioMayoreo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ahorras / {vaquita.unidad ?? "u"}</p>
            <p className="text-base font-extrabold text-emerald-700">{formatoMoneda(ahorroPorPieza)}</p>
          </div>
        </div>

        {/* Barra principal */}
        <BarraVaquita v={{ ...vaquita, estado: estadoReal }} />

        {/* Barra multicapa por tienda participante */}
        {vaquita.aportaciones.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">Desglose visual en la barra:</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
              {vaquita.aportaciones.map((a, idx) => {
                const pct = Math.min(100, Math.round((a.cantidad / vaquita.metaUnidades) * 100));
                const color = COLORES_TIENDA[idx % COLORES_TIENDA.length];
                return (
                  <div
                    key={a.tiendaId}
                    className={`${color} h-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    title={`${a.tienda}: ${a.cantidad}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Información de cierre y Punto de entrega [RF-VAQ-08, RF-VAQ-12] */}
        <div className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-700 sm:grid-cols-2">
          <div suppressHydrationWarning>
            <span className="font-semibold text-gray-900">📅 Fecha límite:</span>{" "}
            {formatoFechaHora(vaquita.cierraEn)}
          </div>
          <div>
            <span className="font-semibold text-gray-900">📍 Punto de entrega:</span> {puntoEntrega}
          </div>
        </div>
      </div>

      {/* Mensajes de feedback [RNF-14] */}
      {mensajeError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm font-bold text-red-900"
        >
          ⚠️ {mensajeError}
        </div>
      )}
      {mensajeExito && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-sm font-bold text-emerald-900"
        >
          {mensajeExito}
        </div>
      )}

      {/* Formulario para aportar ("Entrarle a la vaquita") — solo cuando está ABIERTA [RF-VAQ-02, RF-VAQ-04] */}
      {estadoReal === "ABIERTA" && vaquita.faltan > 0 && (
        <div className="rounded-2xl border-2 border-green-700 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">🤝 Entrarle a la vaquita</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
              Faltan {vaquita.faltan} {vaquita.unidad ?? "unidades"}
            </span>
          </div>

          {/* Botones rápidos de 1 toque [RNF-01, RNF-02] */}
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20]
              .filter((n) => n < vaquita.faltan)
              .map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => fijarCantidad(n)}
                  className={`min-h-11 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                    cantidad === n
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-gray-300 bg-gray-50 text-gray-800"
                  }`}
                >
                  +{n}
                </button>
              ))}
            <button
              type="button"
              onClick={() => fijarCantidad(vaquita.faltan)}
              className={`min-h-11 flex-1 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                cantidad === vaquita.faltan
                  ? "border-amber-600 bg-amber-500 text-gray-950"
                  : "border-amber-400 bg-amber-50 text-amber-950"
              }`}
            >
              🎯 Completar las {vaquita.faltan} que faltan
            </button>
          </div>

          {/* Selector numérico grande (objetivos ≥ 44x44px, cantidad ≥ 24px) [RNF-02] */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Restar 1 unidad"
              disabled={cantidad <= 1 || isPending}
              onClick={() => fijarCantidad(cantidad - 1)}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300 bg-gray-100 text-2xl font-bold text-gray-900 disabled:opacity-40"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <label htmlFor="input-cantidad-vaquita" className="sr-only">
                Cantidad a aportar
              </label>
              <input
                id="input-cantidad-vaquita"
                type="number"
                inputMode="numeric"
                min={1}
                max={vaquita.faltan}
                value={cantidadTexto}
                onChange={(e) => setCantidadTexto(e.target.value)}
                onBlur={() => fijarCantidad(cantidad)}
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white text-center text-2xl font-extrabold text-gray-900"
              />
            </div>
            <button
              type="button"
              aria-label="Sumar 1 unidad"
              disabled={cantidad >= vaquita.faltan || isPending}
              onClick={() => fijarCantidad(cantidad + 1)}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300 bg-gray-100 text-2xl font-bold text-gray-900 disabled:opacity-40"
            >
              +
            </button>
          </div>

          {/* Resumen de ahorro de esta aportación [RN-09] */}
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-950">
            <div className="flex items-center justify-between">
              <span>Pagas en la vaquita:</span>
              <strong className="text-base">{formatoMoneda(cantidad * vaquita.precioMayoreo)}</strong>
            </div>
            <div className="mt-1 flex items-center justify-between text-green-800">
              <span>💰 Te ahorras con estas {cantidad} u.:</span>
              <strong className="text-lg font-extrabold">{formatoMoneda(ahorroDeEstaAportacion)}</strong>
            </div>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAportar(cantidad)}
            className="min-h-12 w-full rounded-xl bg-green-700 px-4 py-3 text-base font-extrabold text-white shadow-sm active:bg-green-800 disabled:opacity-50"
          >
            {isPending
              ? "Registrando tu aportación…"
              : cantidad === vaquita.faltan
                ? `🎉 ¡Poner las ${cantidad} que faltan y completar!`
                : `🐄 Entrarle con ${cantidad} ${vaquita.unidad ?? "unidades"}`}
          </button>
        </div>
      )}

      {/* Lista de aportaciones por tienda [RF-VAQ-03, RN-10] */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            🏪 Tiendas en esta vaquita ({vaquita.aportaciones.length})
          </h2>
          <span className="text-xs font-semibold text-gray-500">
            Total: {vaquita.totalAportado} / {vaquita.metaUnidades}
          </span>
        </div>

        {vaquita.aportaciones.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600">
            Sé la primera tiendita de la colonia en inaugurar esta vaquita.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {vaquita.aportaciones.map((a, idx) => {
              const esMiTienda = tiendaActualId === a.tiendaId;
              const ahorroTienda = Math.round(a.cantidad * ahorroPorPieza * 100) / 100;
              const pct = Math.min(100, Math.round((a.cantidad / vaquita.metaUnidades) * 100));
              const colorDot = COLORES_TIENDA[idx % COLORES_TIENDA.length];

              return (
                <li key={a.tiendaId} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${colorDot}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {a.tienda}{" "}
                        {esMiTienda && (
                          <span className="ml-1 rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-800">
                            Tu tienda
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ahorro: <strong className="text-green-700">{formatoMoneda(ahorroTienda)}</strong> ({pct}% de la
                        meta)
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-base font-extrabold text-gray-900">
                    {a.cantidad} {vaquita.unidad ?? "u."}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Invitar vecinos por WhatsApp y Código QR para el Jurado [RF-VAQ-09, RF-VAQ-10] */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <h2 className="text-lg font-bold text-gray-900">📲 Invita a las tiendas vecinas</h2>
        <p className="text-sm text-gray-600">
          Comparte la vaquita en el grupo de WhatsApp de la colonia o pide que escaneen el código QR.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-gray-950 shadow-xs"
          >
            💬 Invitar por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setMostrarQr((v) => !v)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-800"
          >
            📱 {mostrarQr ? "Ocultar código QR" : "Mostrar código QR"}
          </button>
        </div>

        {mostrarQr && (
          <div className="mt-2 flex flex-col items-center rounded-xl bg-gray-50 p-4 text-center">
            <QrVaquita url={urlActual} size={184} />
            <p className="mt-2 text-xs font-semibold text-gray-700">
              Escanea con otro celular para entrar como <strong>Tienda #4</strong> y aportar en vivo
            </p>
            <p className="mt-1 break-all text-xs text-gray-500">{urlActual}</p>
            {qrApuntaALocal && (
              <p role="alert" className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
                ⚠️ Este QR apunta a <strong>localhost</strong> y no abrirá en otro celular. Pon la IP de la laptop en{" "}
                <code>NEXT_PUBLIC_APP_URL</code> y en <code>TRUSTED_ORIGINS</code> (.env) y reinicia el servidor.
              </p>
            )}
            <button
              type="button"
              onClick={copiarEnlace}
              className="mt-2 min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700"
            >
              {copiado ? "✅ Enlace copiado" : "📋 Copiar enlace de la vaquita"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
