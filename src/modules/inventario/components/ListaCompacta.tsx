"use client";
// [RF-INV-01…05] Vista lista: una fila compacta por producto para revisar todo de un vistazo.
// Mismo − / + que las tarjetas (vender / surtir 1); "Otra cantidad" y el historial viven en el detalle.
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, LoaderCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemInventarioDTO } from "../types";

const NIVEL = {
  critico: { texto: "Urge surtir", texto_clase: "text-semaforo-critico", borde: "border-l-semaforo-critico bg-destructive/5", Icono: AlertCircle },
  bajo: { texto: "Pendiente", texto_clase: "text-semaforo-bajo", borde: "border-l-semaforo-bajo", Icono: AlertCircle },
  ok: { texto: "Bien surtido", texto_clase: "text-semaforo-ok", borde: "border-l-semaforo-ok", Icono: Check },
} as const;

interface Props {
  items: ItemInventarioDTO[];
  bloqueado: boolean;
  pendiente: string | null;
  guardar: (item: ItemInventarioDTO, tipo: "ENTRADA" | "SALIDA", cantidad: number) => Promise<void>;
}

export function ListaCompacta({ items, bloqueado, pendiente, guardar }: Props) {
  return (
    <ul className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Productos de tu tienda">
      {items.map((item) => {
        const nivel = NIVEL[item.nivel];
        const guardando = pendiente === item.id;
        return (
          <li key={item.id} aria-busy={guardando}
            className={cn("flex min-w-0 items-center gap-2 border-l-[5px] py-2 pr-2 pl-3 [&+&]:border-t", nivel.borde)}>
            <Link href={`/inventario/${item.id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
              <strong className="line-clamp-2 leading-tight font-semibold wrap-anywhere">{item.nombre}</strong>
              <span className={cn("flex items-center gap-1 text-[15px]", nivel.texto_clase)}>
                <nivel.Icono aria-hidden="true" className="size-4 shrink-0" />
                {nivel.texto}
                <span className="text-muted-foreground max-[380px]:hidden"> · mín. {item.stockMinimo}</span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="outline" size="icon" className="size-11"
                aria-label={`Vender una unidad de ${item.nombre}`}
                disabled={bloqueado || item.stock === 0}
                onClick={() => void guardar(item, "SALIDA", 1)}>
                <Minus aria-hidden="true" />
              </Button>
              <span className="flex min-w-12 flex-col items-center font-display text-2xl leading-none font-extrabold tabular-nums"
                aria-label={`Me quedan ${item.stock} ${item.unidad}`}>
                {guardando ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" /> : item.stock}
                <small className="mt-1 font-sans text-xs font-normal text-muted-foreground">{item.unidad}</small>
              </span>
              <Button type="button" size="icon" className="size-11"
                aria-label={`Surtir una unidad de ${item.nombre}`}
                disabled={bloqueado}
                onClick={() => void guardar(item, "ENTRADA", 1)}>
                <Plus aria-hidden="true" />
              </Button>
              <Link href={`/inventario/${item.id}`} aria-label={`Ver detalle de ${item.nombre}`}
                className="grid h-11 w-8 place-items-center text-muted-foreground">
                <ChevronRight aria-hidden="true" className="size-5" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
