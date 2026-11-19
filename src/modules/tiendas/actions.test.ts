import { beforeEach, describe, expect, it, vi } from "vitest";

const dobles = vi.hoisted(() => ({
  signUp: vi.fn(),
  sesion: vi.fn(),
  buscarTienda: vi.fn(),
  limitar: vi.fn(),
}));

vi.mock("@/shared/auth", () => ({ auth: { api: { signUpEmail: dobles.signUp } } }));
vi.mock("@/shared/db", () => ({ db: { tienda: { findUnique: dobles.buscarTienda }, $transaction: vi.fn() } }));
vi.mock("@/shared/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/security")>()),
  assertSession: dobles.sesion,
  limitarIntentos: dobles.limitar,
  datosDelRequest: async () => ({ ip: "desconocida", userAgent: "prueba" }),
  registrarEvento: vi.fn(),
}));

import { NoAutorizadoError } from "@/shared/security";
import { registrarCuenta, solicitarVerificacion } from "./actions";
import { cuentaSchema, verificacionSchema } from "./schemas";

const tiendaValida = {
  nombreTienda: "Abarrotes Doña Lupe",
  direccion: "Av. Acueducto 123, Morelia",
  telefono: "4431234567",
  lat: 19.7009,
  lng: -101.1804,
  aceptaPrivacidad: "on",
};

const formData = (datos: Record<string, string | number>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(datos)) fd.append(k, String(v));
  return fd;
};

describe("Registro en dos pasos [RF-VER-01…04, RNF-SEC-03]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dobles.limitar.mockResolvedValue(true);
    dobles.signUp.mockResolvedValue({ user: { id: "u-1" } });
    dobles.sesion.mockResolvedValue({ user: { id: "u-1", name: "Doña Lupe", role: "TENDERO" } });
    dobles.buscarTienda.mockResolvedValue(null);
  });

  describe("cuentaSchema (paso 1)", () => {
    it("valida nombre, correo y contraseña", () => {
      expect(cuentaSchema.safeParse({ nombre: "Doña Lupe", email: "lupe@tienda.com", password: "PasswordSegura123!" }).success).toBe(true);
    });
    it("rechaza contraseñas de menos de 12 caracteres", () => {
      expect(cuentaSchema.safeParse({ nombre: "Doña Lupe", email: "lupe@tienda.com", password: "corta" }).success).toBe(false);
    });
  });

  describe("verificacionSchema (paso 2)", () => {
    it("valida un formulario de tienda completo", () => {
      expect(verificacionSchema.safeParse(tiendaValida).success).toBe(true);
    });
    it("rechaza teléfonos que no sean de 10 dígitos", () => {
      const res = verificacionSchema.safeParse({ ...tiendaValida, telefono: "44312345" });
      expect(res.success).toBe(false);
      if (!res.success) expect(res.error.issues[0]?.message).toMatch(/10 dígitos/);
    });
    it("exige aceptar el aviso de privacidad", () => {
      const { aceptaPrivacidad, ...sinAviso } = tiendaValida;
      void aceptaPrivacidad;
      expect(verificacionSchema.safeParse(sinAviso).success).toBe(false);
    });
    it("rechaza ubicaciones fuera de México", () => {
      expect(verificacionSchema.safeParse({ ...tiendaValida, lat: 48.8566, lng: 2.3522 }).success).toBe(false);
    });
  });

  describe("registrarCuenta", () => {
    it("falla si faltan datos, sin crear nada", async () => {
      const res = await registrarCuenta(formData({ nombre: "Incompleto" }));
      expect(res.ok).toBe(false);
      expect(dobles.signUp).not.toHaveBeenCalled();
    });
    it("crea la cuenta y responde el mensaje genérico", async () => {
      const res = await registrarCuenta(formData({ nombre: "Doña Lupe", email: "lupe@tienda.com", password: "PasswordSegura123!" }));
      expect(res.ok).toBe(true);
      expect(dobles.signUp).toHaveBeenCalledWith({ body: { name: "Doña Lupe", email: "lupe@tienda.com", password: "PasswordSegura123!" } });
    });
    it("si el correo ya existe responde IGUAL (no revela cuentas) [RNF-SEC-06]", async () => {
      dobles.signUp.mockRejectedValue(new Error("User already exists"));
      const res = await registrarCuenta(formData({ nombre: "Doña Lupe", email: "lupe@tienda.com", password: "PasswordSegura123!" }));
      expect(res).toEqual({ ok: true, data: { mensaje: expect.stringContaining("Si el correo está disponible") } });
    });
    it("sin IP conocida limita por correo, no un solo contador para todos", async () => {
      await registrarCuenta(formData({ nombre: "Doña Lupe", email: "lupe@tienda.com", password: "PasswordSegura123!" }));
      const claves = dobles.limitar.mock.calls.map((c) => c[0]);
      expect(claves).toContain("registro:correo:lupe@tienda.com");
      expect(claves).not.toContain("registro:desconocida");
    });
  });

  describe("solicitarVerificacion", () => {
    it("exige sesión", async () => {
      dobles.sesion.mockRejectedValue(new NoAutorizadoError(401));
      expect((await solicitarVerificacion(formData(tiendaValida))).ok).toBe(false);
    });
    it("el admin no registra tiendas", async () => {
      dobles.sesion.mockResolvedValue({ user: { id: "a-1", name: "Admin", role: "ADMIN" } });
      expect((await solicitarVerificacion(formData(tiendaValida))).ok).toBe(false);
    });
    it("una tienda por usuario: no deja enviar dos veces [RN-13]", async () => {
      dobles.buscarTienda.mockResolvedValue({ id: "t-1" });
      const res = await solicitarVerificacion(formData(tiendaValida));
      expect(res).toEqual({ ok: false, error: expect.stringMatching(/ya fue enviada/) });
    });
    it("falla si faltan los documentos", async () => {
      const res = await solicitarVerificacion(formData(tiendaValida));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/Foto de fachada/);
    });
  });
});
