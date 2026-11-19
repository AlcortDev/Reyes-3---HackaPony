"use client";
// [RF-VAQ-01, RF-VAQ-06, RF-VAQ-08] Lista de vaquitas con barra de progreso, sugerencias de bajo stock, filtros y creación.
// Dueño: Jesús.
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatoMoneda } from "@/shared/utils";
import { crearVaquita } from "../actions";
import { tiempoRestante } from "../logic";
import type { ProductoCatalogoDTO, VaquitaDTO } from "../types";
import { SelectorProductoVaquita } from "./SelectorProductoVaquita";
import { SelectorVaquita } from "./SelectorVaquita";

export interface SugerenciaBajoStock {
  productoId: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
}

export function BarraVaquita({ v }: { v: VaquitaDTO }) {
  const esCompleta = v.estado === "COMPLETA";
  const esCerrada = v.estado === "CERRADA";
  const ahorroUnit = Math.max(0, v.precioMenudeo - v.precioMayoreo);

  const colorBarra = esCompleta
    ? "bg-emerald-600"
    : esCerrada
      ? "bg-gray-400"
      : v.porcentaje >= 75
        ? "bg-amber-500"
        : "bg-green-600";

  return (
    <div className="space-y-1.5">
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={v.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de la vaquita ${v.producto}: ${v.porcentaje}%`}
      >
        <div
          className={`h-full transition-all duration-500 ${colorBarra}`}
          style={{ width: `${v.porcentaje}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
        <span className="font-medium text-gray-800">
          <strong className="text-base">{v.totalAportado}</strong>/{v.metaUnidades} {v.unidad ?? "unidades"} (
          {v.porcentaje}%)
        </span>
        {esCompleta ? (
          <span className="font-semibold text-emerald-700">🎉 ¡Meta cumplida!</span>
        ) : esCerrada ? (
          <span className="font-medium text-gray-500">🔒 Cerró sin completar</span>
        ) : (
          <span className="text-gray-700">
            Faltan <strong className="text-amber-700">{v.faltan}</strong> · ahorras{" "}
            <strong className="text-green-700">{formatoMoneda(ahorroUnit)}</strong>/u
          </span>
        )}
      </div>
    </div>
  );
}

function BadgeEstadoVaquita({ v }: { v: VaquitaDTO }) {
  if (v.estado === "COMPLETA") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
        🎉 ¡Precio de mayoreo!
      </span>
    );
  }
  if (v.estado === "CERRADA") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
        🔒 Cerrada
      </span>
    );
  }
  const restante = tiempoRestante(v.cierraEn);
  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        restante.urgente ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"
      }`}
    >
      ⏱️ {restante.texto}
    </span>
  );
}

export function VaquitasLista({
  vaquitas,
  productos = [],
  productoInicialId,
  productosBajoStock = [],
}: {
  vaquitas: VaquitaDTO[];
  productos?: ProductoCatalogoDTO[];
  productoInicialId?: string;
  productosBajoStock?: SugerenciaBajoStock[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"TODAS" | "ABIERTA" | "COMPLETA">("TODAS");
  const [mostrarCrear, setMostrarCrear] = useState(Boolean(productoInicialId));
  const [isPending, startTransition] = useTransition();

  const productosDisponibles = productos.filter((p) => !p.tieneVaquitaAbierta);
  const [productoId, setProductoId] = useState(
    productoInicialId ?? productosDisponibles[0]?.id ?? productos[0]?.id ?? "",
  );
  const productoSeleccionado = productos.find((p) => p.id === productoId);

  const [proveedor, setProveedor] = useState("Central de Abastos Morelia");
  const [metaUnidades, setMetaUnidades] = useState("50");
  const [precioMayoreo, setPrecioMayoreo] = useState(
    productoSeleccionado ? String(Math.max(1, Math.round(productoSeleccionado.precioMenudeo * 0.8 * 10) / 10)) : "15",
  );
  const [horasCierre, setHorasCierre] = useState("48");
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  const cambiarProducto = (nuevoId: string) => {
    setProductoId(nuevoId);
    const prod = productos.find((p) => p.id === nuevoId);
    if (prod) {
      setPrecioMayoreo(String(Math.max(1, Math.round(prod.precioMenudeo * 0.8 * 10) / 10)));
    }
  };

  const abrirCrearConProducto = (idProd: string) => {
    cambiarProducto(idProd);
    setMostrarCrear(true);
  };

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCrear(null);
    const meta = Number.parseInt(metaUnidades, 10);
    const mayoreo = Number.parseFloat(precioMayoreo);
    const horas = Number.parseInt(horasCierre, 10);

    if (!productoId) {
      setErrorCrear("Elige un producto");
      return;
    }
    if (!Number.isFinite(meta) || meta < 2) {
      setErrorCrear("La meta debe ser de al menos 2 unidades");
      return;
    }
    if (!Number.isFinite(mayoreo) || mayoreo <= 0) {
      setErrorCrear("Escribe un precio de mayoreo válido");
      return;
    }

    const cierraEn = new Date(Date.now() + (Number.isFinite(horas) && horas > 0 ? horas : 48) * 3600 * 1000);

    startTransition(async () => {
      const res = await crearVaquita({
        productoId,
        proveedor,
        metaUnidades: meta,
        precioMayoreo: mayoreo,
        cierraEn,
      });
      if (!res.ok) {
        setErrorCrear(res.error);
        return;
      }
      setMostrarCrear(false);
      router.push(`/vaquitas/${res.data.id}`);
      router.refresh();
    });
  };

  const abiertasCount = vaquitas.filter((v) => v.estado === "ABIERTA").length;
  const completasCount = vaquitas.filter((v) => v.estado === "COMPLETA").length;

  const vaquitasFiltradas = vaquitas.filter((v) => {
    if (filtro === "TODAS") return true;
    return v.estado === filtro;
  });

  const contenido = (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-secondary">🐄 Vaquitas de la colonia</h1>
          <p className="text-xl font-semibold text-primary-oscuro">Júntate con otras tienditas para comprar a precio de mayoreo</p>
        </div>
        {productos.length > 0 && (
          <DialogTrigger asChild>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-xl bg-green-700 px-3.5 py-2 text-sm font-bold text-white shadow-xs hover:bg-green-800 active:bg-green-800"
            >
              + Armar vaquita
            </button>
          </DialogTrigger>
        )}
      </div>

      {/* Sugerencias conectadas con el módulo inventario (getProductosBajoStock) */}
      {productosBajoStock.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
            ⚠️ Productos por agotarse en tu tienda
          </p>
          <ul className="space-y-2">
            {productosBajoStock.slice(0, 3).map((item) => {
              const vaquitaAbierta = vaquitas.find(
                (v) =>
                  v.estado === "ABIERTA" &&
                  (v.productoId === item.productoId || v.producto.toLowerCase() === item.nombre.toLowerCase()),
              );
              const productoCatalogo = productos.find(
                (p) => p.id === item.productoId || p.nombre.toLowerCase() === item.nombre.toLowerCase(),
              );

              return (
                <li
                  key={item.productoId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 shadow-2xs"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      🔴 {item.nombre}{" "}
                      <span className="font-normal text-gray-600">
                        (te quedan {item.stock} {item.unidad})
                      </span>
                    </p>
                  </div>
                  {vaquitaAbierta ? (
                    <Link
                      href={`/vaquitas/${vaquitaAbierta.id}`}
                      className="inline-flex min-h-10 items-center rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-800"
                    >
                      🐄 Unirme ({vaquitaAbierta.porcentaje}%) →
                    </Link>
                  ) : productoCatalogo ? (
                    <button
                      type="button"
                      onClick={() => abrirCrearConProducto(productoCatalogo.id)}
                      className="inline-flex min-h-10 items-center rounded-lg border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-200"
                    >
                      + Armar vaquita
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Formulario para armar nueva vaquita [RF-VAQ-06] */}
      {productos.length > 0 && (
        <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <DialogHeader className="min-w-0 text-left">
              <DialogTitle>🐄 Armar nueva vaquita para la colonia</DialogTitle>
              <DialogDescription className="text-base">
                Elige el producto y junta el pedido con las tiendas de tu colonia.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar formulario">
                <X aria-hidden />
              </Button>
            </DialogClose>
          </div>

          <form onSubmit={handleCrear} className="flex min-w-0 flex-col gap-3">
            <div>
              <label htmlFor="vaq-producto" className="block text-base font-bold text-secondary">
                Producto a surtir
              </label>
              <SelectorProductoVaquita
                id="vaq-producto"
                value={productoId}
                onValueChange={cambiarProducto}
                productos={productos}
              />
            </div>

            <div>
              <label htmlFor="vaq-proveedor" className="block text-base font-bold text-secondary">
                Proveedor mayorista
              </label>
              <input
                id="vaq-proveedor"
                type="text"
                required
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej. Central de Abastos Morelia"
                className="mt-1 min-h-11 w-full rounded-lg border-0 bg-card px-3 text-base font-bold text-primary-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vaq-meta" className="block text-base font-bold text-secondary">
                  Meta ({productoSeleccionado?.unidad ?? "unidades"})
                </label>
                <input
                  id="vaq-meta"
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={100000}
                  required
                  value={metaUnidades}
                  onChange={(e) => setMetaUnidades(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border-0 bg-card px-3 text-base font-bold text-primary-oscuro [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label htmlFor="vaq-precio" className="block text-base font-bold text-secondary">
                  Precio mayoreo ($ MXN)
                </label>
                <input
                  id="vaq-precio"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.5"
                  required
                  value={precioMayoreo}
                  onChange={(e) => setPrecioMayoreo(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border-0 bg-card px-3 text-base font-bold text-primary-oscuro [appearance:textfield] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            {productoSeleccionado && (
              <p className="rounded-lg bg-white/90 px-3 py-2 text-sm text-gray-700">
                Precio menudeo: <strong>{formatoMoneda(productoSeleccionado.precioMenudeo)}</strong> · Ahorro por{" "}
                {productoSeleccionado.unidad}:{" "}
                <strong className="text-green-700">
                  {formatoMoneda(Math.max(0, productoSeleccionado.precioMenudeo - Number(precioMayoreo || 0)))}
                </strong>
              </p>
            )}

            <div>
              <label htmlFor="vaq-cierre" className="block text-base font-bold text-secondary">
                Tiempo para juntar la meta
              </label>
              <SelectorVaquita
                id="vaq-cierre"
                value={horasCierre}
                onValueChange={setHorasCierre}
                etiqueta="Tiempo para juntar la meta"
                opciones={[
                  { valor: "12", texto: "12 horas (Urgente para mañana)" },
                  { valor: "24", texto: "1 día (24 horas)" },
                  { valor: "48", texto: "2 días (48 horas)" },
                  { valor: "72", texto: "3 días (72 horas)" },
                ]}
              />
            </div>

            {errorCrear && (
              <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">
                ⚠️ {errorCrear}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 w-full rounded-xl bg-green-700 px-4 py-3 text-base font-bold text-white shadow-sm enabled:hover:bg-green-800 disabled:opacity-50"
            >
              {isPending ? "Publicando vaquita…" : "🐄 Publicar vaquita en la colonia"}
            </button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
          </form>
        </DialogContent>
      )}

      {/* Filtros rápidos con objetivos táctiles ≥ 44px [RNF-02] */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Filtrar vaquitas por estado">
        <button
          type="button"
          role="tab"
          aria-selected={filtro === "TODAS"}
          onClick={() => setFiltro("TODAS")}
          className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            filtro === "TODAS" ? "bg-primary-oscuro text-white shadow-xs hover:bg-foreground" : "bg-white text-gray-700 border border-gray-200 hover:bg-muted"
          }`}
        >
          Todas ({vaquitas.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filtro === "ABIERTA"}
          onClick={() => setFiltro("ABIERTA")}
          className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            filtro === "ABIERTA" ? "bg-green-700 text-white shadow-xs hover:bg-green-800" : "bg-white text-gray-700 border border-gray-200 hover:bg-muted"
          }`}
        >
          🐄 Abiertas ({abiertasCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filtro === "COMPLETA"}
          onClick={() => setFiltro("COMPLETA")}
          className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            filtro === "COMPLETA"
              ? "bg-emerald-700 text-white shadow-xs hover:bg-emerald-800"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-muted"
          }`}
        >
          🎉 Completas ({completasCount})
        </button>
      </div>

      {vaquitasFiltradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-800">No hay vaquitas en esta sección</p>
          <p className="mt-1 text-sm text-gray-600">
            Arma una vaquita nueva para comprar más barato junto con las tiendas vecinas.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
          {vaquitasFiltradas.map((v) => {
            const ahorroUnit = Math.max(0, v.precioMenudeo - v.precioMayoreo);
            const ahorroTotalMeta = ahorroUnit * v.metaUnidades;
            return (
              <li key={v.id}>
                <Link
                  href={`/vaquitas/${v.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition hover:border-green-600 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-gray-900">🐄 {v.producto}</p>
                      <p className="text-xs font-medium text-gray-500">🚚 {v.proveedor}</p>
                    </div>
                    <BadgeEstadoVaquita v={v} />
                  </div>

                  {/* Comparativa clara de precios menudeo vs mayoreo */}
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-500 line-through">{formatoMoneda(v.precioMenudeo)}</span>
                      <span className="text-xl font-extrabold text-green-700">{formatoMoneda(v.precioMayoreo)}</span>
                      <span className="text-xs text-gray-600">por {v.unidad ?? "pieza"}</span>
                    </div>
                    <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                      Ahorro col.: {formatoMoneda(ahorroTotalMeta)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <BarraVaquita v={v} />
                  </div>

                  <div className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-800">
                    {v.estado === "ABIERTA"
                      ? `🤝 Entrarle a la vaquita (faltan ${v.faltan}) →`
                      : "Ver aportaciones y ahorro →"}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <Dialog open={mostrarCrear && productos.length > 0} onOpenChange={setMostrarCrear}>
      {contenido}
    </Dialog>
  );
}
