"use client";

import { useRef, useState } from "react";
import { ClipboardCheck, LoaderCircle, Minus, Plus } from "lucide-react";
import type { ItemInventarioDTO } from "../types";
import estilos from "./inventario.module.css";

interface Props {
  item: ItemInventarioDTO;
  bloqueado: boolean;
  pendiente: boolean;
  guardar: (item: ItemInventarioDTO, tipo: "ENTRADA" | "SALIDA", cantidad: number) => Promise<void>;
  ajustar: (item: ItemInventarioDTO, existencias: number) => Promise<void>;
}

export function ControlesStock({ item, bloqueado, pendiente, guardar, ajustar }: Props) {
  const [captura, setCaptura] = useState(false);
  // Vacío a propósito: con un "1" precargado, lo que se escribía se pegaba (5 → "15").
  const [cantidad, setCantidad] = useState("");
  const formulario = useRef<HTMLFormElement>(null);
  const unidades: Record<string, string> = { pieza: "piezas", bolsa: "bolsas", botella: "botellas", paquete: "paquetes" };
  const n = Number(cantidad);
  const valida = cantidad !== "" && Number.isInteger(n) && n >= 0;

  function otraCantidad(tipo: "ENTRADA" | "SALIDA") {
    if (formulario.current?.reportValidity() && n >= 1) void guardar(item, tipo, n).then(() => setCantidad(""));
  }

  function contar() {
    if (formulario.current?.reportValidity()) void ajustar(item, n).then(() => setCantidad(""));
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
          <input id={`unidades-${item.id}`} type="number" inputMode="numeric" min={0} max={10_000}
            step={1} required value={cantidad} disabled={bloqueado} placeholder="Escribe un número"
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setCantidad(event.target.value)} />
          {valida && (
            <p className={estilos.previa} aria-live="polite">
              Vender {n}: quedan <strong>{Math.max(0, item.stock - n)}</strong> · Surtir {n}: quedan <strong>{item.stock + n}</strong>
            </p>
          )}
          <div className={estilos.accionesCantidad}>
            <button type="button" className={estilos.botonSecundario}
              disabled={bloqueado || item.stock === 0 || !valida || n < 1 || n > item.stock} onClick={() => otraCantidad("SALIDA")}>
              <Minus aria-hidden="true" size={18} /> Vendí {valida && n >= 1 ? n : ""}
            </button>
            <button type="button" className={estilos.botonPrimario}
              disabled={bloqueado || !valida || n < 1} onClick={() => otraCantidad("ENTRADA")}>
              <Plus aria-hidden="true" size={18} /> Me llegaron {valida && n >= 1 ? n : ""}
            </button>
          </div>
          <button type="button" className={`${estilos.botonSecundario} ${estilos.botonConteo}`}
            disabled={bloqueado || !valida || n === item.stock} onClick={contar}>
            <ClipboardCheck aria-hidden="true" size={18} />
            {valida ? `Tengo ${n} en total (corregir)` : "Tengo esta cantidad en total (corregir)"}
          </button>
        </form>
      )}
    </div>
  );
}
