"use client";
// [RF-INV-01…05] Vista lista: una fila compacta por producto para revisar todo de un vistazo.
// Mismo − / + que las tarjetas (vender / surtir 1); "Otra cantidad" y el historial viven en el detalle.
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, LoaderCircle, Minus, Plus } from "lucide-react";
import type { ItemInventarioDTO } from "../types";
import estilos from "./inventario.module.css";

const NIVEL = {
  critico: { texto: "Urge surtir", clase: estilos.critico, Icono: AlertCircle },
  bajo: { texto: "Pendiente", clase: estilos.bajo, Icono: AlertCircle },
  ok: { texto: "Bien surtido", clase: estilos.bien, Icono: Check },
} as const;

interface Props {
  items: ItemInventarioDTO[];
  bloqueado: boolean;
  pendiente: string | null;
  guardar: (item: ItemInventarioDTO, tipo: "ENTRADA" | "SALIDA", cantidad: number) => Promise<void>;
}

export function ListaCompacta({ items, bloqueado, pendiente, guardar }: Props) {
  return (
    <ul className={estilos.listaCompacta} aria-label="Productos de tu tienda">
      {items.map((item) => {
        const nivel = NIVEL[item.nivel];
        const guardando = pendiente === item.id;
        return (
          <li key={item.id} className={`${estilos.fila} ${estilos[`fila_${item.nivel}`]}`} aria-busy={guardando}>
            <Link href={`/inventario/${item.id}`} className={estilos.filaNombre}>
              <strong>{item.nombre}</strong>
              <span className={`${estilos.estado} ${nivel.clase}`}>
                <nivel.Icono aria-hidden="true" size={15} />
                {nivel.texto}
                <span className={estilos.filaMinimo}> · mín. {item.stockMinimo}</span>
              </span>
            </Link>
            <div className={estilos.filaControles}>
              <button
                type="button"
                className={estilos.filaBoton}
                aria-label={`Vender una unidad de ${item.nombre}`}
                disabled={bloqueado || item.stock === 0}
                onClick={() => void guardar(item, "SALIDA", 1)}
              >
                <Minus aria-hidden="true" size={20} />
              </button>
              <span className={estilos.filaCantidad} aria-label={`Me quedan ${item.stock} ${item.unidad}`}>
                {guardando ? <LoaderCircle aria-hidden="true" size={18} className={estilos.girando} /> : item.stock}
                <small>{item.unidad}</small>
              </span>
              <button
                type="button"
                className={`${estilos.filaBoton} ${estilos.surtir}`}
                aria-label={`Surtir una unidad de ${item.nombre}`}
                disabled={bloqueado}
                onClick={() => void guardar(item, "ENTRADA", 1)}
              >
                <Plus aria-hidden="true" size={20} />
              </button>
              <Link href={`/inventario/${item.id}`} className={estilos.filaDetalle} aria-label={`Ver detalle de ${item.nombre}`}>
                <ChevronRight aria-hidden="true" size={20} />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
