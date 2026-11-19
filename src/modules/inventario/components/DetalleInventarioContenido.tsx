"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Clock3, Users } from "lucide-react";
import type { VaquitaDTO } from "@/modules/vaquitas";
import { formatoFechaHora, formatoMoneda } from "@/shared/utils";
import type { DetalleInventarioDTO } from "../types";
import { ControlesStock } from "./ControlesStock";
import { ProductoEncabezado } from "./ProductoEncabezado";
import { useInventario } from "./useInventario";
import estilos from "./inventario.module.css";

interface Props {
  detalle: DetalleInventarioDTO;
  vaquita: VaquitaDTO | null;
  consultaFallida?: boolean;
}

export function DetalleInventarioContenido({ detalle, vaquita, consultaFallida }: Props) {
  const origen = useMemo(() => [detalle], [detalle]);
  const estado = useInventario(origen);
  const item = estado.items[0];

  return (
    <section className={estilos.modulo}>
      <Link href="/inventario" className={estilos.volver}><ArrowLeft aria-hidden="true" size={18} />Volver al inventario</Link>
      <header className={estilos.detalleTitulo}>
        <h1>{detalle.nombre}</h1>
        <p>{detalle.categoria} · {formatoMoneda(detalle.precioMenudeo)} por {detalle.unidad}</p>
      </header>
      {estado.aviso && (
        <div className={estilos.avisoError} role="alert">
          <p>{estado.aviso.texto}</p>
          {estado.aviso.incierto && <button type="button" className={estilos.enlaceBoton}
            onClick={() => window.location.reload()}>Actualizar inventario</button>}
        </div>
      )}
      <div className={estilos.tarjeta}>
        <ProductoEncabezado item={item} />
        <ControlesStock item={item} bloqueado={estado.bloqueado} pendiente={estado.pendiente === item.id} guardar={estado.guardar} />
        <p className={estilos.prediccion}>
          <Clock3 aria-hidden="true" size={19} />
          {detalle.diasParaAgotarse === null ? "Sin datos suficientes para estimar cuándo se acaba."
            : detalle.diasParaAgotarse === 0 ? "A este ritmo, podría acabarse hoy."
              : `A este ritmo, se te acaba en ~${detalle.diasParaAgotarse} día${detalle.diasParaAgotarse === 1 ? "" : "s"}.`}
        </p>
      </div>
      {item.nivel === "critico" && vaquita && (
        <aside className={estilos.oportunidad} aria-label="Opción para surtir en grupo">
          <h2><Users aria-hidden="true" size={20} className="inline" /> Surtir con otras tiendas</h2>
          <p>Faltan {vaquita.faltan} unidades para alcanzar el precio de mayoreo.</p>
          <p>Te ahorras <strong>{formatoMoneda(vaquita.precioMenudeo - vaquita.precioMayoreo)}</strong> por {detalle.unidad}.</p>
          <Link href={`/vaquitas/${vaquita.id}`} className={estilos.botonPrimario}>
            Unirme a la vaquita <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </aside>
      )}
      {item.nivel === "critico" && !vaquita && !consultaFallida && (
        <aside className={estilos.oportunidad} aria-label="Crear compra en grupo">
          <h2>Surtir con otras tiendas</h2>
          <p>Aún no hay una vaquita abierta para este producto.</p>
          <Link href={`/vaquitas?productoId=${encodeURIComponent(detalle.productoId)}`} className={estilos.botonPrimario}>
            Armar una vaquita <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </aside>
      )}
      {item.nivel === "critico" && consultaFallida && <p role="status">No pudimos consultar las vaquitas. Vuelve a abrir el detalle para revisarlas.</p>}
      <section className={estilos.historial} aria-labelledby="titulo-movimientos">
        <h2 id="titulo-movimientos">Movimientos recientes</h2>
        {detalle.movimientos.length === 0 ? <p>Aún no registras movimientos de este producto.</p> : (
          <ul className={estilos.movimientos}>
            {detalle.movimientos.map((movimiento) => (
              <li key={movimiento.id}>
                <div>
                  <span>{movimiento.tipo === "ENTRADA" ? "Surtido" : "Salida"}</span>
                  <time dateTime={movimiento.fecha}>{formatoFechaHora(movimiento.fecha)}</time>
                </div>
                <strong className={movimiento.tipo === "ENTRADA" ? estilos.bien : undefined}>
                  {movimiento.tipo === "ENTRADA" ? "+" : "−"}{movimiento.cantidad}
                </strong>
              </li>
            ))}
          </ul>
        )}
        {detalle.movimientos.length === 20 && <p>Se muestran los últimos 20 movimientos.</p>}
      </section>
    </section>
  );
}
