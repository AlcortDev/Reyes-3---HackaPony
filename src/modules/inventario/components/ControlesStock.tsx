"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Minus, Plus } from "lucide-react";
import type { ItemInventarioDTO } from "../types";
import estilos from "./inventario.module.css";

interface Props {
  item: ItemInventarioDTO;
  bloqueado: boolean;
  pendiente: boolean;
  guardar: (item: ItemInventarioDTO, tipo: "ENTRADA" | "SALIDA", cantidad: number) => Promise<void>;
}

export function ControlesStock({ item, bloqueado, pendiente, guardar }: Props) {
  const [captura, setCaptura] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const formulario = useRef<HTMLFormElement>(null);
  const unidades: Record<string, string> = { pieza: "piezas", bolsa: "bolsas", botella: "botellas", paquete: "paquetes" };

  function otraCantidad(tipo: "ENTRADA" | "SALIDA") {
    if (formulario.current?.reportValidity()) void guardar(item, tipo, Number(cantidad));
  }

  return (
    <div className={estilos.controles} aria-busy={pendiente}>
      <div className={estilos.filaStock}>
        <button type="button" className={estilos.botonStock}
          aria-label={`Vender una unidad de ${item.nombre}`}
          aria-describedby={item.stock === 0 ? `sin-stock-${item.id}` : undefined}
          disabled={bloqueado || item.stock === 0} onClick={() => void guardar(item, "SALIDA", 1)}>
          <Minus aria-hidden="true" size={22} /><span>Vender</span>
        </button>
        <div className={estilos.existencias}>
          <span>Me quedan</span>
          <strong>{item.stock}</strong>
          <span>{item.stock === 1 ? item.unidad : unidades[item.unidad] ?? item.unidad}</span>
        </div>
        <button type="button" className={`${estilos.botonStock} ${estilos.surtir}`}
          aria-label={`Surtir una unidad de ${item.nombre}`}
          disabled={bloqueado} onClick={() => void guardar(item, "ENTRADA", 1)}>
          <Plus aria-hidden="true" size={22} /><span>Surtir</span>
        </button>
      </div>
      {item.stock === 0 && <p id={`sin-stock-${item.id}`} role="status" className={estilos.critico}>No hay unidades para sacar</p>}
      <div className={estilos.pieControles}>
        <span>Mínimo: {item.stockMinimo}</span>
        <button type="button" className={estilos.enlaceBoton} aria-expanded={captura}
          aria-controls={`cantidad-${item.id}`} disabled={bloqueado} onClick={() => setCaptura(!captura)}>
          {pendiente ? <><LoaderCircle aria-hidden="true" size={16} /> Guardando…</> : captura ? "Cerrar cantidad" : "Otra cantidad"}
        </button>
      </div>
      {captura && (
        <form id={`cantidad-${item.id}`} ref={formulario} className={estilos.formCantidad}
          onSubmit={(event) => event.preventDefault()}>
          <label htmlFor={`unidades-${item.id}`}>¿Cuántas unidades?</label>
          <input id={`unidades-${item.id}`} type="number" inputMode="numeric" min={1} max={10_000}
            step={1} required value={cantidad} disabled={bloqueado}
            onChange={(event) => setCantidad(event.target.value)} />
          <div className={estilos.accionesCantidad}>
            <button type="button" className={estilos.botonSecundario}
              disabled={bloqueado || item.stock === 0} onClick={() => otraCantidad("SALIDA")}>Registrar salida</button>
            <button type="button" className={estilos.botonPrimario}
              disabled={bloqueado} onClick={() => otraCantidad("ENTRADA")}>Registrar surtido</button>
          </div>
        </form>
      )}
    </div>
  );
}
