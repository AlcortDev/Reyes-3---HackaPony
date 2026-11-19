import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("el historial muestra la misma hora de Morelia aunque el servidor esté en UTC", async () => {
  vi.stubEnv("TZ", "UTC");
  vi.resetModules();
  const { formatoFechaHora } = await import("@/shared/utils");
  const fecha = new Date("2026-11-19T18:00:00Z");
  const esperado = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City",
  }).format(fecha);
  expect(formatoFechaHora(fecha)).toBe(esperado);
});
