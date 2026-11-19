"use server";
// [RF-DEM-02] Reiniciar demo. Dueño: Hiram (Bloque 3).
// Recarga inventario, movimientos y vaquitas desde los datos del seed
// SIN borrar cuentas (User/Account/Session), tiendas ni documentos.
import type { Resultado } from "@/shared/types";
import { assertAdmin } from "@/shared/security/guards";
import { registrarEvento } from "@/shared/security/audit";
import { db } from "@/shared/db";

// ── Datos idénticos al seed (prisma/seed.ts) ────────────────

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (d: number) => new Date(Date.now() - d * DIA);

const PRODUCTOS_SEED = [
  { clave: "coca", nombre: "Coca-Cola 600 ml" },
  { clave: "sabritas", nombre: "Sabritas 45 g" },
  { clave: "bimbo", nombre: "Pan Bimbo grande" },
  { clave: "huevo", nombre: "Huevo (kg)" },
  { clave: "aceite", nombre: "Aceite 1 L" },
  { clave: "frijol", nombre: "Frijol 1 kg" },
  { clave: "arroz", nombre: "Arroz 1 kg" },
  { clave: "maseca", nombre: "Maseca 1 kg" },
  { clave: "leche", nombre: "Leche 1 L" },
  { clave: "papel", nombre: "Papel higiénico 4 pzas" },
] as const;

type Clave = (typeof PRODUCTOS_SEED)[number]["clave"];

// stock inicial [stock, stockMinimo] por tienda (email → productos)
const STOCK_POR_TIENDA: Record<string, Partial<Record<Clave, [number, number]>>> = {
  "lupe@lavaquita.local": { coca: [4, 6], sabritas: [3, 5], leche: [12, 6] },
  "guero@lavaquita.local": { huevo: [2, 4], bimbo: [2, 3], maseca: [30, 5] },
  "esperanza@lavaquita.local": { aceite: [1, 3], papel: [2, 4], coca: [8, 6] },
};

// estatus de verificación de las tiendas demo en el seed
const ESTATUS_SEED: Record<string, "APROBADA" | "PENDIENTE"> = {
  "lupe@lavaquita.local": "APROBADA",
  "guero@lavaquita.local": "APROBADA",
  "esperanza@lavaquita.local": "APROBADA",
  "tienda4@lavaquita.local": "APROBADA",
  "sanjuan@lavaquita.local": "PENDIENTE",
};

// ── Acción ──────────────────────────────────────────────────

export async function reiniciarDemo(): Promise<Resultado> {
  const { user } = await assertAdmin();

  await db.$transaction(async (tx) => {
    // 1. Borrar datos transaccionales (orden: hijos → padres)
    await tx.aportacion.deleteMany();
    await tx.canasta.deleteMany();
    await tx.movimiento.deleteMany();
    await tx.inventario.deleteMany();
    // Limpiar límites de intentos y bloqueos de los ensayos.
    // La bitácora (AuditLog) NO se borra: es evidencia de seguridad [RNF-SEC-11 · ISO A.8.15].
    await tx.rateLimit.deleteMany();
    await tx.limiteIntentos.deleteMany();
    await tx.user.updateMany({ data: { failedLoginAttempts: 0, lockedUntil: null } });

    // Regresar las tiendas demo a su estatus del seed (San Juan pendiente para aprobarla en vivo)
    for (const [email, estatus] of Object.entries(ESTATUS_SEED)) {
      await tx.tienda.updateMany({
        where: { usuario: { email } },
        data: {
          estatusVerificacion: estatus,
          motivoRechazo: null,
          revisadaEn: estatus === "APROBADA" ? new Date() : null,
          revisadaPorId: null,
        },
      });
    }

    // 2. Buscar productos por nombre y tiendas aprobadas
    const productos = await tx.producto.findMany();
    const productosPorClave = new Map<string, string>();
    for (const p of productos) {
      const seed = PRODUCTOS_SEED.find((s) => s.nombre === p.nombre);
      if (seed) productosPorClave.set(seed.clave, p.id);
    }

    const tiendasAprobadas = await tx.tienda.findMany({
      where: { estatusVerificacion: "APROBADA" },
      include: { usuario: { select: { email: true } } },
    });

    // 3. Recrear inventario + movimientos por tienda
    for (const tienda of tiendasAprobadas) {
      const stockMap = STOCK_POR_TIENDA[tienda.usuario.email] ?? {};

      for (const seed of PRODUCTOS_SEED) {
        const productoId = productosPorClave.get(seed.clave);
        if (!productoId) continue;

        const [stock, stockMinimo] = stockMap[seed.clave] ?? [
          15 + Math.floor(Math.random() * 20),
          5,
        ];

        const inv = await tx.inventario.create({
          data: { tiendaId: tienda.id, productoId, stock, stockMinimo },
        });

        // Salidas de los últimos 7 días para la predicción [RN-07]
        await tx.movimiento.createMany({
          data: Array.from({ length: 7 }, (_, i) => ({
            inventarioId: inv.id,
            tipo: "SALIDA" as const,
            cantidad: 1 + Math.floor(Math.random() * 4),
            fecha: haceDias(i + 1),
          })),
        });
      }
    }

    // 4. Recrear vaquitas
    const cocaId = productosPorClave.get("coca");
    const masecaId = productosPorClave.get("maseca");
    const tiendaPorEmail = new Map(tiendasAprobadas.map((t) => [t.usuario.email, t.id]));

    if (cocaId) {
      const coca = await tx.canasta.create({
        data: {
          productoId: cocaId,
          proveedor: "Central de Abastos Morelia",
          metaUnidades: 100,
          precioMayoreo: 14.5,
          cierraEn: new Date(Date.now() + 2 * DIA),
          estado: "ABIERTA",
        },
      });
      const gueroId = tiendaPorEmail.get("guero@lavaquita.local");
      const esperanzaId = tiendaPorEmail.get("esperanza@lavaquita.local");
      const aportaciones = [];
      if (gueroId) aportaciones.push({ canastaId: coca.id, tiendaId: gueroId, cantidad: 40 });
      if (esperanzaId)
        aportaciones.push({ canastaId: coca.id, tiendaId: esperanzaId, cantidad: 30 });
      if (aportaciones.length) await tx.aportacion.createMany({ data: aportaciones });
    }

    if (masecaId) {
      const maseca = await tx.canasta.create({
        data: {
          productoId: masecaId,
          proveedor: "Distribuidora Michoacana",
          metaUnidades: 50,
          precioMayoreo: 19,
          cierraEn: haceDias(1),
          estado: "COMPLETA",
        },
      });
      const lupeId = tiendaPorEmail.get("lupe@lavaquita.local");
      const gueroId = tiendaPorEmail.get("guero@lavaquita.local");
      const esperanzaId = tiendaPorEmail.get("esperanza@lavaquita.local");
      const aportaciones = [];
      if (lupeId) aportaciones.push({ canastaId: maseca.id, tiendaId: lupeId, cantidad: 20 });
      if (gueroId) aportaciones.push({ canastaId: maseca.id, tiendaId: gueroId, cantidad: 15 });
      if (esperanzaId)
        aportaciones.push({ canastaId: maseca.id, tiendaId: esperanzaId, cantidad: 15 });
      if (aportaciones.length) await tx.aportacion.createMany({ data: aportaciones });
    }
  });

  await registrarEvento("DEMO_REINICIADA", { exito: true, userId: user.id });

  return { ok: true, data: undefined };
}
