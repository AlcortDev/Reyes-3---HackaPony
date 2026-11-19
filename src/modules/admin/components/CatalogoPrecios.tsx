"use client";
// [RN-11] El admin fija el precio de mayoreo del catálogo. Los tenderos solo lo ven al armar una vaquita.
import { Check, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatoMoneda } from "@/shared/utils";
import { actualizarPrecioMayoreo } from "../actions";
import type { ProductoCatalogoAdminDTO } from "../queries";

function FilaProducto({ p }: { p: ProductoCatalogoAdminDTO }) {
  const router = useRouter();
  const [valor, setValor] = useState(p.precioMayoreo != null ? String(p.precioMayoreo) : "");
  const [guardando, setGuardando] = useState(false);
  const numero = Number(valor);
  const valido = valor !== "" && Number.isFinite(numero) && numero > 0 && numero < p.precioMenudeo;
  const cambio = valido && numero !== p.precioMayoreo;

  async function guardar() {
    setGuardando(true);
    try {
      const r = await actualizarPrecioMayoreo({ productoId: p.id, precioMayoreo: numero });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Precio de mayoreo de ${p.nombre}: ${formatoMoneda(numero)}`);
      router.refresh();
    } catch {
      toast.error("No se pudo guardar. Revisa que sigas con sesión de admin.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <li className="grid gap-3 rounded-2xl border bg-card p-4 shadow-tarjeta sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-bold">{p.nombre}</p>
        <p className="text-sm text-muted-foreground">
          {p.categoria} · menudeo {formatoMoneda(p.precioMenudeo)} por {p.unidad}
        </p>
        {p.precioMayoreo == null && (
          <p className="mt-1 text-sm font-semibold text-semaforo-bajo">Sin precio de mayoreo: no se pueden armar vaquitas</p>
        )}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (cambio) void guardar();
        }}
      >
        <label className="grid gap-1 text-sm font-semibold">
          Mayoreo ($)
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={valor}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={valor !== "" && !valido}
            className={cn("w-32", valor !== "" && !valido && "border-destructive")}
          />
        </label>
        <Button type="submit" disabled={!cambio || guardando} aria-label={`Guardar precio de ${p.nombre}`}>
          <Check className="size-5" aria-hidden />
          {guardando ? "…" : "Guardar"}
        </Button>
      </form>
      {valor !== "" && !valido && (
        <p className="text-sm text-destructive sm:col-span-2">Debe ser mayor a $0 y menor al menudeo ({formatoMoneda(p.precioMenudeo)}).</p>
      )}
    </li>
  );
}

export function CatalogoPrecios({ productos }: { productos: ProductoCatalogoAdminDTO[] }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Tag className="size-6 text-primary" aria-hidden /> Precios de mayoreo
        </h1>
        <p className="text-muted-foreground">
          Es el precio del proveedor al juntar la meta. Las tiendas lo ven al armar una vaquita, pero no lo pueden cambiar.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {productos.map((p) => (
          <FilaProducto key={p.id} p={p} />
        ))}
      </ul>
    </section>
  );
}
