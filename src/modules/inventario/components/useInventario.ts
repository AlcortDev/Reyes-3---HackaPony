"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ajustarExistencias, registrarMovimiento } from "../actions";
import type { Resultado } from "@/shared/types";
import { nivelStock } from "../logic";
import type { ItemInventarioDTO } from "../types";
import { MOVIMIENTO_SIN_CONFIRMAR } from "../mensajes";

/** Solo presentamos existencias confirmadas por el servidor. Una petición a la vez. */
export function useInventario(origen: ItemInventarioDTO[]) {
  const [confirmado, setConfirmado] = useState({ origen, stocks: {} as Record<string, number> });
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; incierto: boolean } | null>(null);
  const enviando = useRef(false);
  const origenActual = useRef(origen);
  origenActual.current = origen;
  const router = useRouter();

  // La revalidación trae una nueva instantánea del servidor, incluido el historial.
  // Ajustar el estado aquí evita un efecto que sobrescriba una respuesta posterior.
  if (confirmado.origen !== origen) setConfirmado({ origen, stocks: {} });
  const stocks = confirmado.origen === origen ? confirmado.stocks : {};
  const items = origen.map((item) => {
    const stock = stocks[item.id] ?? item.stock;
    return { ...item, stock, nivel: nivelStock(stock, item.stockMinimo) };
  });

  async function guardar(item: ItemInventarioDTO, tipo: "ENTRADA" | "SALIDA", cantidad: number) {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10_000) {
      setAviso({ texto: "Escribe una cantidad entera entre 1 y 10,000.", incierto: false });
      return;
    }
    await ejecutar(item, () => registrarMovimiento({ inventarioId: item.id, tipo, cantidad }),
      `${tipo === "ENTRADA" ? "Surtido" : "Salida"} guardado: ${item.nombre}`);
  }

  /** Conteo físico: deja el stock exactamente en `existencias`. */
  async function ajustar(item: ItemInventarioDTO, existencias: number) {
    if (!Number.isInteger(existencias) || existencias < 0 || existencias > 1_000_000) {
      setAviso({ texto: "Escribe cuántas tienes en total (un número entero).", incierto: false });
      return;
    }
    await ejecutar(item, () => ajustarExistencias({ inventarioId: item.id, existencias }),
      `Conteo guardado: ${item.nombre} ahora tiene ${existencias}`);
  }

  async function ejecutar(item: ItemInventarioDTO, llamada: () => Promise<Resultado<{ stock: number }>>, exito: string) {
    if (enviando.current || aviso?.incierto) return;
    enviando.current = true;
    const instantanea = origenActual.current;
    setPendiente(item.id);
    setAviso(null);
    try {
      const resultado = await llamada();
      if (!resultado.ok) {
        const incierto = resultado.error === MOVIMIENTO_SIN_CONFIRMAR;
        setAviso({ texto: resultado.error, incierto });
        toast.error(resultado.error);
        if (!incierto) router.refresh();
        return;
      }
      if (origenActual.current === instantanea) {
        setConfirmado((actual) => ({
          ...actual, stocks: { ...actual.stocks, [item.id]: resultado.data.stock },
        }));
      } else {
        // Una revalidación más reciente ya reemplazó la instantánea que inició
        // la petición. No sobrescribirla con una respuesta que llegó después.
        router.refresh();
      }
      toast.success(exito);
    } catch {
      // Una desconexión puede ocurrir después del commit. No ofrecer reintentar
      // a ciegas: primero hay que consultar las existencias reales de nuevo.
      const texto = MOVIMIENTO_SIN_CONFIRMAR;
      setAviso({ texto, incierto: true });
      toast.error(texto);
    } finally {
      enviando.current = false;
      setPendiente(null);
    }
  }

  return { items, guardar, ajustar, pendiente, aviso, bloqueado: pendiente !== null || Boolean(aviso?.incierto) };
}
