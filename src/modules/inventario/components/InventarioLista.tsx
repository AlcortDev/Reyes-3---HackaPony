"use client";
// [RF-INV-01…05, RNF-01…06] Inventario móvil, con movimientos confirmados.
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, PackageOpen, Search } from "lucide-react";
import type { ItemInventarioDTO } from "../types";
import { ControlesStock } from "./ControlesStock";
import { ProductoEncabezado } from "./ProductoEncabezado";
import { useInventario } from "./useInventario";
import { LectorCodigo } from "./LectorCodigo";
import estilos from "./inventario.module.css";

export function InventarioLista({ items }: { items: ItemInventarioDTO[] }) {
  const estado = useInventario(items);
  const [busqueda, setBusqueda] = useState("");
  const [soloPorSurtir, setSoloPorSurtir] = useState(false);
  const [lectorAbierto, setLectorAbierto] = useState(false);
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-MX");
  const texto = normalizar(busqueda.trim());
  const prioridad = { critico: 0, bajo: 1, ok: 2 };
  const visibles = estado.items.filter((i) =>
    (!soloPorSurtir || i.nivel !== "ok") && normalizar(`${i.nombre} ${i.categoria}`).includes(texto),
  ).sort((a, b) => prioridad[a.nivel] - prioridad[b.nivel] || a.nombre.localeCompare(b.nombre, "es-MX"));
  const porAgotarse = estado.items.filter((i) => i.nivel === "critico").length;
  return (
    <section className={estilos.modulo}>
      <header className={estilos.titulo}>
        <h1>Mi inventario</h1>
        <p>Una venta con −. Un surtido con +.</p>
      </header>
      {porAgotarse > 0 && (
        <p className={estilos.alertaStock} role="status">
          <AlertTriangle aria-hidden="true" size={20} />
          {`${porAgotarse} producto${porAgotarse === 1 ? "" : "s"} por agotarse`}
        </p>
      )}
      {items.length > 0 && (
        <div className={estilos.filtros}>
          <label className={estilos.buscador}>
            <Search aria-hidden="true" size={20} /><span className="sr-only">Buscar producto</span>
            <input type="search" placeholder="Buscar producto" value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)} />
          </label>
          <label className={estilos.filtroCheck}>
            <input type="checkbox" checked={soloPorSurtir} onChange={(event) => setSoloPorSurtir(event.target.checked)} />
            Por surtir
          </label>
        </div>
      )}
      {items.length > 0 && <LectorCodigo bloqueado={estado.bloqueado} onAbiertoChange={setLectorAbierto} />}
      {estado.aviso && (
        <div className={estilos.avisoError} role="alert">
          <p>{estado.aviso.texto}</p>
          {estado.aviso.incierto && <button type="button" className={estilos.enlaceBoton}
            onClick={() => window.location.reload()}>Actualizar inventario</button>}
        </div>
      )}
      <ul className={estilos.lista} aria-label="Productos de tu tienda">
        {visibles.map((item) => (
          <li key={item.id} className={estilos.tarjeta}>
            <ProductoEncabezado item={item} />
            <ControlesStock item={item} bloqueado={estado.bloqueado || lectorAbierto} pendiente={estado.pendiente === item.id} guardar={estado.guardar} ajustar={estado.ajustar} />
            <Link href={`/inventario/${item.id}`} className={estilos.verDetalle}>
              Ver detalle y opciones para surtir <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </li>
        ))}
      </ul>
      {visibles.length === 0 && (
        <div className={estilos.vacio}>
          <PackageOpen aria-hidden="true" size={30} />
          <h2>{items.length === 0 ? "Todavía no hay productos en tu inventario" : "No encontramos productos con ese filtro"}</h2>
          <p>{items.length === 0 ? "Aquí aparecerán los productos asignados a tu tienda." : "Prueba otro nombre o revisa todos tus productos."}</p>
          {items.length > 0 && <button type="button" className={estilos.botonSecundario}
            onClick={() => { setBusqueda(""); setSoloPorSurtir(false); }}>Ver todos los productos</button>}
        </div>
      )}
    </section>
  );
}
