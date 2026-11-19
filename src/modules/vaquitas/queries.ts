// Lecturas de vaquitas. Dueño: Jesús.
import { db } from "@/shared/db";
import type { EstadoCanasta } from "@/shared/types";
import { agruparAportacionesPorTienda, estadoEfectivo, faltantes, porcentaje } from "./logic";
import type { AportacionDTO, ProductoCatalogoDTO, VaquitaDetalleDTO, VaquitaDTO } from "./types";

const ORDEN_ESTADO: Record<EstadoCanasta, number> = {
  ABIERTA: 0,
  COMPLETA: 1,
  CERRADA: 2,
};

function mapearCanasta(c: {
  id: string;
  productoId: string;
  proveedor: string;
  metaUnidades: number;
  precioMayoreo: number;
  cierraEn: Date;
  estado: EstadoCanasta;
  producto: { nombre: string; unidad: string; precioMenudeo: number };
  aportaciones: Array<{ tiendaId: string; cantidad: number; tienda: { id: string; nombre: string } }>;
}): VaquitaDetalleDTO {
  const totalAportado = c.aportaciones.reduce((acc, a) => acc + a.cantidad, 0);
  const estado = estadoEfectivo(c.estado, c.cierraEn, totalAportado, c.metaUnidades);
  const aportaciones = agruparAportacionesPorTienda(
    c.aportaciones.map((a) => ({
      tiendaId: a.tiendaId,
      tienda: a.tienda.nombre,
      cantidad: a.cantidad,
    })),
  );

  return {
    id: c.id,
    productoId: c.productoId,
    producto: c.producto.nombre,
    unidad: c.producto.unidad,
    proveedor: c.proveedor,
    metaUnidades: c.metaUnidades,
    totalAportado,
    faltan: faltantes(totalAportado, c.metaUnidades),
    porcentaje: porcentaje(totalAportado, c.metaUnidades),
    precioMenudeo: c.producto.precioMenudeo,
    precioMayoreo: c.precioMayoreo,
    estado,
    cierraEn: c.cierraEn.toISOString(),
    aportaciones,
  };
}

/** [RF-VAQ-01] Lista las vaquitas de la colonia evaluando RN-08. */
export async function listarVaquitas(filtro?: { estado?: EstadoCanasta }): Promise<VaquitaDTO[]> {
  const canastas = await db.canasta.findMany({
    include: {
      producto: { select: { nombre: true, unidad: true, precioMenudeo: true } },
      aportaciones: {
        include: { tienda: { select: { id: true, nombre: true } } },
      },
    },
    orderBy: { creadaEn: "desc" },
  });

  const mapeadas = canastas.map(mapearCanasta);
  const filtradas = filtro?.estado ? mapeadas.filter((v) => v.estado === filtro.estado) : mapeadas;

  return filtradas.sort((a, b) => {
    const diffEstado = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
    if (diffEstado !== 0) return diffEstado;
    return new Date(a.cierraEn).getTime() - new Date(b.cierraEn).getTime();
  });
}

/** [RF-VAQ-03, RF-VAQ-05] Detalle con aportaciones agrupadas por tienda [RN-10]. Mismo shape que GET /api/canastas/[id]. */
export async function getVaquita(canastaId: string): Promise<VaquitaDetalleDTO | null> {
  const canasta = await db.canasta.findUnique({
    where: { id: canastaId },
    include: {
      producto: { select: { nombre: true, unidad: true, precioMenudeo: true } },
      aportaciones: {
        include: { tienda: { select: { id: true, nombre: true } } },
      },
    },
  });

  if (!canasta) return null;
  return mapearCanasta(canasta);
}

/** [RN-12] Contrato usado por inventario (alerta → vaquita). */
export async function getVaquitaAbiertaPorProducto(productoId: string): Promise<VaquitaDTO | null> {
  const canastas = await db.canasta.findMany({
    where: { productoId, estado: "ABIERTA" },
    include: {
      producto: { select: { nombre: true, unidad: true, precioMenudeo: true } },
      aportaciones: {
        include: { tienda: { select: { id: true, nombre: true } } },
      },
    },
    orderBy: { creadaEn: "desc" },
  });

  for (const c of canastas) {
    const dto = mapearCanasta(c);
    if (dto.estado === "ABIERTA") return dto;
  }
  return null;
}

/** Contrato usado por ahorro (agrupado por vaquita y con estado efectivo RN-06/RN-08). */
export async function getAportacionesPorTienda(tiendaId: string): Promise<AportacionDTO[]> {
  const canastas = await db.canasta.findMany({
    where: {
      aportaciones: {
        some: { tiendaId },
      },
    },
    include: {
      producto: { select: { nombre: true, precioMenudeo: true } },
      aportaciones: { select: { tiendaId: true, cantidad: true } },
    },
    orderBy: { creadaEn: "desc" },
  });

  return canastas.map((c) => {
    const totalCanasta = c.aportaciones.reduce((acc, a) => acc + a.cantidad, 0);
    const cantidadTienda = c.aportaciones
      .filter((a) => a.tiendaId === tiendaId)
      .reduce((acc, a) => acc + a.cantidad, 0);
    const estado = estadoEfectivo(c.estado, c.cierraEn, totalCanasta, c.metaUnidades);

    return {
      vaquitaId: c.id,
      producto: c.producto.nombre,
      cantidad: cantidadTienda,
      precioMenudeo: c.producto.precioMenudeo,
      precioMayoreo: c.precioMayoreo,
      estado,
    };
  });
}

/** Catálogo de productos para el formulario de crear vaquita [RF-VAQ-06, RN-11, RN-12]. */
export async function listarProductosParaVaquita(): Promise<ProductoCatalogoDTO[]> {
  const [productos, abiertas] = await Promise.all([
    db.producto.findMany({
      orderBy: { nombre: "asc" },
    }),
    listarVaquitas({ estado: "ABIERTA" }),
  ]);

  const idsAbiertos = new Set(abiertas.map((v) => v.productoId));

  return productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    unidad: p.unidad,
    precioMenudeo: p.precioMenudeo,
    tieneVaquitaAbierta: idsAbiertos.has(p.id),
  }));
}

/** [RF-VAQ-11] Verifica si una tienda ya ingresó a su inventario el pedido de una vaquita COMPLETA. */
export async function haRecibidoPedidoTienda(canastaId: string, tiendaId: string): Promise<boolean> {
  const registro = await db.auditLog.findFirst({
    where: {
      evento: "VAQUITA_PEDIDO_RECIBIDO",
      objetivo: `${canastaId}:${tiendaId}`,
      exito: true,
    },
    select: { id: true },
  });
  return Boolean(registro);
}
