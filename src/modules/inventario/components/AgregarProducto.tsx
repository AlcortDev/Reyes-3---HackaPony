"use client";
// [RF-INV-11] Agregar un producto al inventario: del catálogo o uno nuevo. Va debajo de "Buscar por código".
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, PackagePlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { formatoMoneda } from "@/shared/utils";
import { agregarProductoAlInventario } from "../actions";
import { altaInventarioSchema, type AltaInventarioInput } from "../alta";
import type { ProductoParaAgregarDTO } from "../types";
import estilos from "./inventario.module.css";

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
      <button type="button" className={estilos.botonSecundario} aria-expanded={false} onClick={onAbrir}>
        <PackagePlus aria-hidden="true" size={20} /> Agregar producto
      </button>
    );
  }
  // key: si llega otro código desde el lector, el formulario arranca de cero
  return <Formulario key={codigoInicial ?? ""} catalogo={catalogo} codigoInicial={codigoInicial} onCerrar={onCerrar} />;
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
          : {
              tipo: "nuevo",
              nombre: nuevo.nombre,
              categoria: nuevo.categoria,
              unidad: nuevo.unidad,
              precioMenudeo: numero(nuevo.precio),
              codigoBarras: nuevo.codigo,
            },
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
    <section className={estilos.lector} aria-label="Agregar producto">
      <div className={estilos.lectorTitulo}>
        <h2>Agregar producto</h2>
        <button type="button" aria-label="Cerrar" className={estilos.cerrarLector} onClick={onCerrar}>
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <div className={estilos.pestanasAlta} role="tablist" aria-label="De dónde viene el producto">
        {(["catalogo", "nuevo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            className={modo === m ? estilos.pestanaActiva : estilos.pestana}
            onClick={() => {
              setModo(m);
              setError(null);
            }}
          >
            {m === "catalogo" ? "Del catálogo" : "Producto nuevo"}
          </button>
        ))}
      </div>

      <form className={estilos.formAlta} onSubmit={guardar} noValidate>
        {modo === "catalogo" ? (
          catalogo.length === 0 ? (
            <p className={estilos.textoSuave}>Ya tienes todos los productos del catálogo. Usa «Producto nuevo».</p>
          ) : (
            <fieldset className={estilos.campoAlta}>
              <legend>¿Cuál producto?</legend>
              <label className={estilos.buscador}>
                <Search aria-hidden="true" size={20} />
                <span className="sr-only">Buscar en el catálogo</span>
                <input type="search" placeholder="Buscar por nombre o código" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </label>
              <ul className={estilos.opcionesCatalogo}>
                {filtrados.map((p) => (
                  <li key={p.id}>
                    <label className={productoId === p.id ? estilos.opcionElegida : estilos.opcion}>
                      <input type="radio" name="productoId" value={p.id} checked={productoId === p.id} onChange={() => setProductoId(p.id)} />
                      <span>
                        <strong>{p.nombre}</strong>
                        <small>
                          {p.categoria} · {formatoMoneda(p.precioMenudeo)} por {p.unidad}
                        </small>
                      </span>
                      {productoId === p.id && <Check aria-hidden="true" size={20} />}
                    </label>
                  </li>
                ))}
                {filtrados.length === 0 && <li className={estilos.textoSuave}>No hay productos con ese nombre. Prueba «Producto nuevo».</li>}
              </ul>
            </fieldset>
          )
        ) : (
          <>
            <label className={estilos.campoAlta}>
              Nombre del producto
              <input value={nuevo.nombre} maxLength={80} placeholder="Ej. Galletas Marías 170 g" onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </label>
            <div className={estilos.dosColumnas}>
              <label className={estilos.campoAlta}>
                Categoría
                <input value={nuevo.categoria} maxLength={40} placeholder="Ej. Galletas" onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} />
              </label>
              <label className={estilos.campoAlta}>
                Unidad
                <input value={nuevo.unidad} maxLength={30} placeholder="pieza, kg, litro" onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })} />
              </label>
            </div>
            <div className={estilos.dosColumnas}>
              <label className={estilos.campoAlta}>
                Precio al público ($)
                <input type="number" inputMode="decimal" step="0.5" min="0" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })} />
              </label>
              <label className={estilos.campoAlta}>
                Código de barras (opcional)
                <input inputMode="numeric" autoComplete="off" maxLength={64} value={nuevo.codigo} onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} />
              </label>
            </div>
          </>
        )}

        <div className={estilos.dosColumnas}>
          <label className={estilos.campoAlta}>
            ¿Cuántas tienes ahorita?
            <input type="number" inputMode="numeric" min="0" step="1" value={stock} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label className={estilos.campoAlta}>
            Avísame cuando queden
            <input type="number" inputMode="numeric" min="0" step="1" value={minimo} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setMinimo(e.target.value)} />
          </label>
        </div>

        {error && (
          <p role="alert" className={estilos.critico}>
            {error}
          </p>
        )}
        <button type="submit" className={estilos.botonPrimario} disabled={guardando || (modo === "catalogo" && catalogo.length === 0)}>
          <PackagePlus aria-hidden="true" size={20} />
          {guardando ? "Agregando…" : "Agregar a mi inventario"}
        </button>
      </form>
    </section>
  );
}
