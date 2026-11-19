"use client";

// [RF-VAQ-06 · RN-12] Opciones del catálogo con precio y disponibilidad.
import { formatoMoneda } from "@/shared/utils";
import type { ProductoCatalogoDTO } from "../types";
import { SelectorVaquita } from "./SelectorVaquita";

export function SelectorProductoVaquita({
  id,
  value,
  onValueChange,
  productos,
}: {
  id: string;
  value: string;
  onValueChange: (productoId: string) => void;
  productos: ProductoCatalogoDTO[];
}) {
  return (
    <SelectorVaquita
      id={id}
      value={value}
      onValueChange={onValueChange}
      etiqueta="Productos a surtir"
      placeholder="Elige un producto"
      opciones={productos.map((producto) => ({
        valor: producto.id,
        texto: producto.nombre,
        detalle:
          producto.precioMayoreo != null
            ? `Mayoreo: ${formatoMoneda(producto.precioMayoreo)} · menudeo ${formatoMoneda(producto.precioMenudeo)} / ${producto.unidad}`
            : `Menudeo: ${formatoMoneda(producto.precioMenudeo)} / ${producto.unidad}`,
        deshabilitada: producto.tieneVaquitaAbierta,
        aviso: producto.tieneVaquitaAbierta
          ? "Ya tiene vaquita abierta"
          : producto.precioMayoreo == null
            ? "Sin precio de mayoreo todavía"
            : undefined,
      }))}
    />
  );
}
