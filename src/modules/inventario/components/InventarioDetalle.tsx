// [RF-INV-06…08] Composición de servidor: la integración consume solo la API pública de Jesús.
import { getVaquitaAbiertaPorProducto } from "@/modules/vaquitas";
import type { DetalleInventarioDTO } from "../types";
import { vaquitaVigente } from "../oportunidad";
import { DetalleInventarioContenido } from "./DetalleInventarioContenido";

export async function InventarioDetalle({ detalle }: { detalle: DetalleInventarioDTO }) {
  let vaquita = null;
  let consultaFallida = false;
  if (detalle.nivel === "critico") {
    try {
      vaquita = vaquitaVigente(await getVaquitaAbiertaPorProducto(detalle.productoId), detalle.productoId);
    } catch {
      consultaFallida = true;
    }
  }
  return <DetalleInventarioContenido detalle={detalle} vaquita={vaquita} consultaFallida={consultaFallida} />;
}
