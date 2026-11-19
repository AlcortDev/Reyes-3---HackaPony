"use client";
// [RF-INV-11] Agregar un producto al inventario: del catálogo o uno nuevo. Va debajo de "Buscar por código".
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, PackagePlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { formatoMoneda } from "@/shared/utils";
import { agregarProductoAlInventario } from "../actions";
import { altaInventarioSchema, type AltaInventarioInput } from "../alta";
import type { ProductoParaAgregarDTO } from "../types";

const normalizar = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-MX");
const numero = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));

interface Props {
  catalogo: ProductoParaAgregarDTO[];
  abierto: boolean;
  /** Código que no se encontró en el lector: se busca en el catálogo o se usa para el producto nuevo. */
  codigoInicial?: string;
  onAbrir: () => void;
  onCerrar: () => void;
}

export function AgregarProducto({ catalogo, abierto, codigoInicial, onAbrir, onCerrar }: Props) {
  if (!abierto) {
    return (
      <Button type="button" variant="outline" aria-expanded={false} onClick={onAbrir}>
        <PackagePlus aria-hidden="true" data-icon="inline-start" /> Agregar producto
      </Button>
    );
  }
  // key: si llega otro código desde el lector, el formulario arranca de cero
  return <Formulario key={codigoInicial ?? ""} catalogo={catalogo} codigoInicial={codigoInicial} onCerrar={onCerrar} />;
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <Field>
      <FieldLabel>{etiqueta}</FieldLabel>
      {children}
    </Field>
  );
}

function Formulario({ catalogo, codigoInicial, onCerrar }: Omit<Props, "abierto" | "onAbrir">) {
  const router = useRouter();
  const enCatalogo = codigoInicial ? catalogo.find((p) => p.codigoBarras === codigoInicial) : undefined;
  const [modo, setModo] = useState<"catalogo" | "nuevo">(codigoInicial && !enCatalogo ? "nuevo" : "catalogo");
  const [busqueda, setBusqueda] = useState("");
  const [productoId, setProductoId] = useState(enCatalogo?.id ?? "");
  const [nuevo, setNuevo] = useState({ nombre: "", categoria: "", unidad: "pieza", precio: "", codigo: enCatalogo ? "" : (codigoInicial ?? "") });
  const [stock, setStock] = useState("0");
  const [minimo, setMinimo] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const t = normalizar(busqueda.trim());
    return catalogo.filter((p) => normalizar(`${p.nombre} ${p.categoria} ${p.codigoBarras ?? ""}`).includes(t)).slice(0, 30);
  }, [catalogo, busqueda]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const entrada: AltaInventarioInput = {
      producto:
        modo === "catalogo"
          ? { tipo: "catalogo", productoId }
          : { tipo: "nuevo", nombre: nuevo.nombre, categoria: nuevo.categoria, unidad: nuevo.unidad, precioMenudeo: numero(nuevo.precio), codigoBarras: nuevo.codigo },
      stockInicial: numero(stock),
      stockMinimo: numero(minimo),
    };
    const valido = altaInventarioSchema.safeParse(entrada);
    if (!valido.success) {
      setError(valido.error.issues[0]?.message ?? "Revisa los datos del producto");
      return;
    }
    setGuardando(true);
    try {
      const r = await agregarProductoAlInventario(entrada);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast.success(`¡${r.data.nombre} ya está en tu inventario!`);
      onCerrar();
      router.refresh();
    } catch {
      setError("No pudimos agregar el producto. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section aria-label="Agregar producto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle><h2 className="text-lg font-bold">Agregar producto</h2></CardTitle>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={onCerrar}><X aria-hidden="true" /></Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div role="tablist" aria-label="De dónde viene el producto" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["catalogo", "nuevo"] as const).map((m) => (
              <Button key={m} type="button" variant="ghost" role="tab" aria-selected={modo === m}
                onClick={() => { setModo(m); setError(null); }}
                className={cn("min-h-11 rounded-lg", modo === m ? "bg-card text-foreground shadow-sm hover:bg-card" : "text-muted-foreground")}>
                {m === "catalogo" ? "Del catálogo" : "Producto nuevo"}
              </Button>
            ))}
          </div>

          <form className="flex flex-col gap-4" onSubmit={guardar} noValidate>
            {modo === "catalogo" ? (
              catalogo.length === 0 ? (
                <p className="text-muted-foreground">Ya tienes todos los productos del catálogo. Usa «Producto nuevo».</p>
              ) : (
                <fieldset className="flex min-w-0 flex-col gap-2">
                  <legend className="mb-2 font-semibold">¿Cuál producto?</legend>
                  <InputGroup>
                    <InputGroupInput type="search" aria-label="Buscar en el catálogo" placeholder="Buscar por nombre o código"
                      value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
                  </InputGroup>
                  <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                    {filtrados.map((p) => {
                      const elegido = productoId === p.id;
                      return (
                        <li key={p.id}>
                          <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-2",
                            elegido && "border-primary bg-success-surface text-secondary")}>
                            <input type="radio" name="productoId" value={p.id} checked={elegido} onChange={() => setProductoId(p.id)}
                              className="size-5 shrink-0 accent-[var(--primary)]" />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <strong>{p.nombre}</strong>
                              <small className="text-[15px] text-muted-foreground">{p.categoria} · {formatoMoneda(p.precioMenudeo)} por {p.unidad}</small>
                            </span>
                            {elegido && <Check aria-hidden="true" className="size-5" />}
                          </label>
                        </li>
                      );
                    })}
                    {filtrados.length === 0 && <li className="text-muted-foreground">No hay productos con ese nombre. Prueba «Producto nuevo».</li>}
                  </ul>
                </fieldset>
              )
            ) : (
              <FieldGroup>
                <Campo etiqueta="Nombre del producto">
                  <Input aria-label="Nombre del producto" value={nuevo.nombre} maxLength={80} placeholder="Ej. Galletas Marías 170 g"
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
                </Campo>
                <div className="grid gap-4 min-[420px]:grid-cols-2">
                  <Campo etiqueta="Categoría">
                    <Input aria-label="Categoría" value={nuevo.categoria} maxLength={40} placeholder="Ej. Galletas"
                      onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Unidad">
                    <Input aria-label="Unidad" value={nuevo.unidad} maxLength={30} placeholder="pieza, kg, litro"
                      onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Precio al público ($)">
                    <Input aria-label="Precio al público ($)" type="number" inputMode="decimal" step="0.5" min="0" value={nuevo.precio}
                      onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} />
                  </Campo>
                  <Campo etiqueta="Código de barras (opcional)">
                    <Input aria-label="Código de barras (opcional)" inputMode="numeric" autoComplete="off" maxLength={64} value={nuevo.codigo}
                      onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} />
                  </Campo>
                </div>
              </FieldGroup>
            )}

            <div className="grid gap-4 min-[420px]:grid-cols-2">
              <Campo etiqueta="¿Cuántas tienes ahorita?">
                <Input aria-label="¿Cuántas tienes ahorita?" type="number" inputMode="numeric" min="0" step="1" value={stock}
                  onFocus={(e) => e.currentTarget.select()} onChange={(e) => setStock(e.target.value)} />
              </Campo>
              <Campo etiqueta="Avísame cuando queden">
                <Input aria-label="Avísame cuando queden" type="number" inputMode="numeric" min="0" step="1" value={minimo}
                  onFocus={(e) => e.currentTarget.select()} onChange={(e) => setMinimo(e.target.value)} />
              </Campo>
            </div>

            {error && <Alert variant="destructive" role="alert"><AlertTitle>{error}</AlertTitle></Alert>}
            <Button type="submit" disabled={guardando || (modo === "catalogo" && catalogo.length === 0)}>
              <PackagePlus aria-hidden="true" data-icon="inline-start" />
              {guardando ? "Agregando…" : "Agregar a mi inventario"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
