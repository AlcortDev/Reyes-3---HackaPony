"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Clock3, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { VaquitaDTO } from "@/modules/vaquitas";
import { formatoFechaHora, formatoMoneda } from "@/shared/utils";
import type { DetalleInventarioDTO } from "../types";
import { ControlesStock } from "./ControlesStock";
import { ProductoEncabezado } from "./ProductoEncabezado";
import { useInventario } from "./useInventario";

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
    <section className="flex min-w-0 flex-col gap-5">
      <Button asChild variant="link" className="self-start px-0">
        <Link href="/inventario"><ArrowLeft aria-hidden="true" data-icon="inline-start" />Volver al inventario</Link>
      </Button>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary wrap-anywhere">{detalle.nombre}</h1>
        <p className="text-muted-foreground">{detalle.categoria} · {formatoMoneda(detalle.precioMenudeo)} por {detalle.unidad}</p>
      </header>
      {estado.aviso && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>{estado.aviso.texto}</AlertTitle>
          {estado.aviso.incierto && <AlertDescription>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>Actualizar inventario</Button>
          </AlertDescription>}
        </Alert>
      )}
      <Card>
        <CardHeader><ProductoEncabezado item={item} /></CardHeader>
        <CardContent><ControlesStock item={item} bloqueado={estado.bloqueado} pendiente={estado.pendiente === item.id} guardar={estado.guardar} /></CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Separator />
          <p className="flex items-start gap-2 text-muted-foreground">
            <Clock3 aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-accent-strong" />
            {detalle.diasParaAgotarse === null ? "Sin datos suficientes para estimar cuándo se acaba."
              : detalle.diasParaAgotarse === 0 ? "A este ritmo, podría acabarse hoy."
                : `A este ritmo, se te acaba en ~${detalle.diasParaAgotarse} día${detalle.diasParaAgotarse === 1 ? "" : "s"}.`}
          </p>
        </CardFooter>
      </Card>
      {item.nivel === "critico" && (vaquita || !consultaFallida) && (
        <aside aria-label={vaquita ? "Opción para surtir en grupo" : "Crear compra en grupo"}>
          <Card variant="highlight">
            <CardHeader>
              <CardTitle><h2 className="flex items-center gap-2 text-lg font-bold"><Users aria-hidden="true" size={22} />Surtir con otras tiendas</h2></CardTitle>
              <CardDescription>{vaquita ? `Faltan ${vaquita.faltan} unidades para alcanzar el precio de mayoreo.` : "Aún no hay una vaquita abierta para este producto."}</CardDescription>
            </CardHeader>
            {vaquita && <CardContent><p>Te ahorras <strong>{formatoMoneda(vaquita.precioMenudeo - vaquita.precioMayoreo)}</strong> por {detalle.unidad}.</p></CardContent>}
            <CardFooter>
              <Button asChild variant="accent" className="w-full">
                <Link href={vaquita ? `/vaquitas/${vaquita.id}` : `/vaquitas?productoId=${encodeURIComponent(detalle.productoId)}`}>
                  {vaquita ? "Unirme a la vaquita" : "Armar una vaquita"}<ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </aside>
      )}
      {item.nivel === "critico" && consultaFallida && <p role="status" className="text-muted-foreground">No pudimos consultar las vaquitas. Vuelve a abrir el detalle para revisarlas.</p>}
      <section className="flex flex-col gap-3" aria-labelledby="titulo-movimientos">
        <h2 id="titulo-movimientos" className="text-xl font-bold">Movimientos recientes</h2>
        {detalle.movimientos.length === 0 ? <p className="text-muted-foreground">Aún no registras movimientos de este producto.</p> : (
          <ul className="flex flex-col">
            {detalle.movimientos.map((movimiento) => (
              <li key={movimiento.id} className="flex items-start justify-between gap-3 border-b py-4">
                <div>
                  <span className="font-semibold">{movimiento.tipo === "ENTRADA" ? "Surtido" : "Salida"}</span>
                  <time className="block text-muted-foreground" dateTime={movimiento.fecha}>{formatoFechaHora(movimiento.fecha)}</time>
                </div>
                <strong className="text-secondary tabular-nums">{movimiento.tipo === "ENTRADA" ? "+" : "−"}{movimiento.cantidad}</strong>
              </li>
            ))}
          </ul>
        )}
        {detalle.movimientos.length === 20 && <p className="text-muted-foreground">Se muestran los últimos 20 movimientos.</p>}
      </section>
    </section>
  );
}
