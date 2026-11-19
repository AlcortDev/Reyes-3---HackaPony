"use client";
// [RF-INV-01…05, RNF-01…06] Inventario móvil, con movimientos confirmados.
import Link from "next/link";
import { useId, useState } from "react";
import { AlertTriangle, ArrowRight, PackageOpen, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ItemInventarioDTO } from "../types";
import { ControlesStock } from "./ControlesStock";
import { ProductoEncabezado } from "./ProductoEncabezado";
import { useInventario } from "./useInventario";
import { LectorCodigo } from "./LectorCodigo";

export function InventarioLista({ items }: { items: ItemInventarioDTO[] }) {
  const estado = useInventario(items);
  const [busqueda, setBusqueda] = useState("");
  const [soloPorSurtir, setSoloPorSurtir] = useState(false);
  const [lectorAbierto, setLectorAbierto] = useState(false);
  const filtroId = useId();
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-MX");
  const texto = normalizar(busqueda.trim());
  const prioridad = { critico: 0, bajo: 1, ok: 2 };
  const visibles = estado.items.filter((i) =>
    (!soloPorSurtir || i.nivel !== "ok") && normalizar(`${i.nombre} ${i.categoria}`).includes(texto),
  ).sort((a, b) => prioridad[a.nivel] - prioridad[b.nivel] || a.nombre.localeCompare(b.nombre, "es-MX"));
  const porAgotarse = estado.items.filter((i) => i.nivel === "critico").length;
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary">Mi inventario</h1>
      </header>
      {porAgotarse > 0 && (
        <Alert variant="warning" role="status">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>{`${porAgotarse} producto${porAgotarse === 1 ? "" : "s"} por agotarse`}</AlertTitle>
          <AlertDescription>Revisa los que necesitan surtido primero.</AlertDescription>
        </Alert>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <InputGroup className={cn("col-span-2", lectorAbierto ? "lg:col-span-2" : "lg:col-span-1")}>
            <InputGroupInput type="search" aria-label="Buscar producto" placeholder="Buscar producto"
              value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
            <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          </InputGroup>
          <Field orientation="horizontal" className="min-h-12 w-fit gap-2">
            <Checkbox id={filtroId} checked={soloPorSurtir} onCheckedChange={(valor) => setSoloPorSurtir(valor === true)} />
            <FieldLabel htmlFor={filtroId} className="min-h-11 cursor-pointer">Por surtir</FieldLabel>
          </Field>
          <div className={cn(lectorAbierto ? "col-span-2 w-full lg:col-span-3" : "justify-self-end")}>
            <LectorCodigo bloqueado={estado.bloqueado} onAbiertoChange={setLectorAbierto} />
          </div>
        </div>
      )}
      {estado.aviso && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>{estado.aviso.texto}</AlertTitle>
          {estado.aviso.incierto && <AlertDescription>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>Actualizar inventario</Button>
          </AlertDescription>}
        </Alert>
      )}
      <ul className="grid gap-4 lg:grid-cols-2 lg:items-start" aria-label="Productos de tu tienda">
        {visibles.map((item) => (
          <li key={item.id} className="h-full">
            <Card className="h-full">
              <CardHeader><ProductoEncabezado item={item} /></CardHeader>
              <CardContent>
                <ControlesStock item={item} bloqueado={estado.bloqueado || lectorAbierto} pendiente={estado.pendiente === item.id} guardar={estado.guardar} ajustar={estado.ajustar} />
              </CardContent>
              <CardFooter className="mt-auto flex-col items-stretch gap-2">
                <Separator />
                <Button asChild variant="link" className="h-auto min-h-12 justify-between px-0 whitespace-normal text-left">
                  <Link href={`/inventario/${item.id}`}>
                    Ver detalle y opciones para surtir <ArrowRight aria-hidden="true" data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
      {visibles.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><PackageOpen aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>{items.length === 0 ? "Todavía no hay productos en tu inventario" : "No encontramos productos con ese filtro"}</EmptyTitle>
            <EmptyDescription>{items.length === 0 ? "Aquí aparecerán los productos asignados a tu tienda." : "Prueba otro nombre o revisa todos tus productos."}</EmptyDescription>
          </EmptyHeader>
          {items.length > 0 && <EmptyContent><Button type="button" variant="outline"
            onClick={() => { setBusqueda(""); setSoloPorSurtir(false); }}>Ver todos los productos</Button></EmptyContent>}
        </Empty>
      )}
    </section>
  );
}
