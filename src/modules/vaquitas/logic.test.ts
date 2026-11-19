import { describe, expect, it } from "vitest";
import {
  agruparAportacionesPorTienda,
  construirMensajeWhatsApp,
  estadoEfectivo,
  faltantes,
  porcentaje,
  tiempoRestante,
} from "./logic";

describe("estadoEfectivo [RN-06, RN-08]", () => {
  const ahora = new Date("2026-11-19T12:00:00Z");
  const manana = new Date("2026-11-20T12:00:00Z");
  const ayer = new Date("2026-11-18T12:00:00Z");

  it("abierta mientras no llegue a la meta ni venza", () => {
    expect(estadoEfectivo("ABIERTA", manana, 70, 100, ahora)).toBe("ABIERTA");
  });
  it("completa al llegar a la meta", () => {
    expect(estadoEfectivo("ABIERTA", manana, 100, 100, ahora)).toBe("COMPLETA");
  });
  it("cerrada si venció sin meta", () => {
    expect(estadoEfectivo("ABIERTA", ayer, 70, 100, ahora)).toBe("CERRADA");
  });
  it("respeta estado no abierto previo", () => {
    expect(estadoEfectivo("COMPLETA", ayer, 100, 100, ahora)).toBe("COMPLETA");
    expect(estadoEfectivo("CERRADA", manana, 50, 100, ahora)).toBe("CERRADA");
  });
});

describe("porcentaje y faltantes", () => {
  it("calcula", () => {
    expect(porcentaje(70, 100)).toBe(70);
    expect(porcentaje(120, 100)).toBe(100);
    expect(porcentaje(10, 0)).toBe(0);
    expect(faltantes(70, 100)).toBe(30);
    expect(faltantes(120, 100)).toBe(0);
  });
});

describe("agruparAportacionesPorTienda [RN-10]", () => {
  it("suma múltiples aportaciones de la misma tienda y ordena de mayor a menor", () => {
    const agrupadas = agruparAportacionesPorTienda([
      { tiendaId: "t1", tienda: "Doña Lupe", cantidad: 10 },
      { tiendaId: "t2", tienda: "El Güero", cantidad: 40 },
      { tiendaId: "t1", tienda: "Doña Lupe", cantidad: 15 },
    ]);
    expect(agrupadas).toEqual([
      { tiendaId: "t2", tienda: "El Güero", cantidad: 40 },
      { tiendaId: "t1", tienda: "Doña Lupe", cantidad: 25 },
    ]);
  });
});

describe("tiempoRestante [RF-VAQ-08]", () => {
  const ahora = new Date("2026-11-19T12:00:00Z");

  it("indica cuando ya venció", () => {
    const res = tiempoRestante("2026-11-19T11:59:00Z", ahora);
    expect(res.vencida).toBe(true);
    expect(res.texto).toBe("Plazo vencido");
  });

  it("formatea días y horas restantes", () => {
    const res = tiempoRestante("2026-11-21T15:00:00Z", ahora);
    expect(res.vencida).toBe(false);
    expect(res.texto).toBe("2d 3h");
    expect(res.urgente).toBe(false);
  });

  it("marca urgente cuando faltan menos de 6 horas", () => {
    const res = tiempoRestante("2026-11-19T14:30:00Z", ahora);
    expect(res.vencida).toBe(false);
    expect(res.texto).toBe("2h 30m");
    expect(res.urgente).toBe(true);
  });
});

describe("construirMensajeWhatsApp [RF-VAQ-09]", () => {
  it("genera mensaje con unidades faltantes y link", () => {
    const msg = construirMensajeWhatsApp(
      {
        producto: "Coca-Cola 600 ml",
        proveedor: "Central de Abastos Morelia",
        totalAportado: 70,
        metaUnidades: 100,
        faltan: 30,
        precioMenudeo: 18,
        precioMayoreo: 14.5,
      },
      "http://localhost:3000/vaquitas/ck123",
    );
    expect(msg).toContain("Coca-Cola 600 ml");
    expect(msg).toContain("70/100");
    expect(msg).toContain("http://localhost:3000/vaquitas/ck123");
  });
});
