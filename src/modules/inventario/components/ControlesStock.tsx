"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ItemInventarioDTO } from "../types";

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
    <div className="flex flex-col gap-3" aria-busy={pendiente}>
      <div className="grid grid-cols-[minmax(64px,1fr)_minmax(84px,1.2fr)_minmax(64px,1fr)] items-center gap-3">
        <Button type="button" variant="stock" size="stock"
          aria-label={`Vender una unidad de ${item.nombre}`}
          aria-describedby={item.stock === 0 ? `sin-stock-${item.id}` : undefined}
          disabled={bloqueado || item.stock === 0} onClick={() => void guardar(item, "SALIDA", 1)}>
          <Minus aria-hidden="true" data-icon="inline-start" /><span>Vender</span>
        </Button>
        <div className="flex min-w-0 flex-col items-center text-muted-foreground">
          <span>Me quedan</span>
          <strong className="font-display text-4xl leading-tight font-extrabold text-foreground tabular-nums wrap-anywhere">{item.stock}</strong>
          <span>{item.stock === 1 ? item.unidad : unidades[item.unidad] ?? item.unidad}</span>
        </div>
        <Button type="button" size="stock"
          aria-label={`Surtir una unidad de ${item.nombre}`}
          disabled={bloqueado} onClick={() => void guardar(item, "ENTRADA", 1)}>
          <Plus aria-hidden="true" data-icon="inline-start" /><span>Surtir</span>
        </Button>
      </div>
      {item.stock === 0 && <p id={`sin-stock-${item.id}`} role="status" className="text-destructive">No hay unidades para sacar</p>}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground">Mínimo: {item.stockMinimo}</span>
        <Button type="button" variant="link" className="px-0" aria-expanded={captura}
          aria-controls={`cantidad-${item.id}`} disabled={bloqueado} onClick={() => setCaptura(!captura)}>
          {pendiente ? <><LoaderCircle aria-hidden="true" data-icon="inline-start" /> Guardando…</> : captura ? "Cerrar cantidad" : "Otra cantidad"}
        </Button>
      </div>
      {captura && (
        <form id={`cantidad-${item.id}`} ref={formulario} className="flex flex-col gap-4"
          onSubmit={(event) => event.preventDefault()}>
          <Separator />
          <FieldGroup>
            <Field data-disabled={bloqueado}>
              <FieldLabel htmlFor={`unidades-${item.id}`}>¿Cuántas unidades?</FieldLabel>
              <Input id={`unidades-${item.id}`} type="number" inputMode="numeric" min={1} max={10_000}
                step={1} required value={cantidad} disabled={bloqueado}
                onChange={(event) => setCantidad(event.target.value)} />
            </Field>
          </FieldGroup>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline"
              disabled={bloqueado || item.stock === 0} onClick={() => otraCantidad("SALIDA")}>Registrar salida</Button>
            <Button type="button"
              disabled={bloqueado} onClick={() => otraCantidad("ENTRADA")}>Registrar surtido</Button>
          </div>
        </form>
      )}
    </div>
  );
}
