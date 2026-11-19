import { describe, expect, it, vi } from "vitest";
import { motivoSchema } from "@/modules/tiendas";

// Mock para simular módulos externos si se prueban las actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Acciones de Admin [RF-VER-06, RN-16]", () => {
  describe("motivoSchema", () => {
    it("acepta motivos válidos mayores o iguales a 5 caracteres", () => {
      const res = motivoSchema.safeParse("La fotografía de la fachada está borrosa");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("La fotografía de la fachada está borrosa");
      }
    });

    it("rechaza motivos menores a 5 caracteres o vacíos", () => {
      expect(motivoSchema.safeParse("").success).toBe(false);
      expect(motivoSchema.safeParse("  abc ").success).toBe(false);
    });

    it("trimea espacios en blanco automáticamente", () => {
      const res = motivoSchema.safeParse("   Documento ilegible   ");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("Documento ilegible");
      }
    });
  });

  describe("Control de acceso y validación de transiciones", () => {
    it("aprobarTienda y rechazarTienda requieren permisos de administrador", async () => {
      const { aprobarTienda, rechazarTienda } = await import("./actions");
      // Sin sesión iniciada, debe fallar o rechazar con NoAutorizadoError
      await expect(aprobarTienda("tienda-falsa")).rejects.toThrow();
      await expect(rechazarTienda("tienda-falsa", "Motivo de prueba válido")).rejects.toThrow();
    });

    it("reactivarTienda y suspenderTienda requieren permisos de administrador", async () => {
      const { reactivarTienda, suspenderTienda } = await import("./actions");
      await expect(reactivarTienda("tienda-falsa")).rejects.toThrow();
      await expect(suspenderTienda("tienda-falsa", "Motivo de prueba válido")).rejects.toThrow();
    });
  });
});
