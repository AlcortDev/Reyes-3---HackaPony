import Image from "next/image";
import { AlertCircle, Check, Package } from "lucide-react";
import type { ItemInventarioDTO } from "../types";
import estilos from "./inventario.module.css";

export function ProductoEncabezado({ item }: { item: ItemInventarioDTO }) {
  const estado = {
    critico: { texto: "Urge surtir", clase: estilos.critico, Icono: AlertCircle },
    bajo: { texto: "Pendiente", clase: estilos.bajo, Icono: AlertCircle },
    ok: { texto: "Bien surtido", clase: estilos.bien, Icono: Check },
  }[item.nivel];

  return (
    <div className={estilos.productoEncabezado}>
      <div className={estilos.imagenProducto}>
        {item.imagen ? <Image src={item.imagen} alt="" width={44} height={44} unoptimized /> : <Package aria-hidden="true" size={28} />}
      </div>
      <div className={estilos.productoTexto}>
        <h2>{item.nombre}</h2>
        <p className={`${estilos.estado} ${estado.clase}`}>
          <estado.Icono aria-hidden="true" size={17} />{estado.texto}
        </p>
      </div>
    </div>
  );
}
