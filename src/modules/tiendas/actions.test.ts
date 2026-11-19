import { describe, expect, it } from "vitest";
import { registroSchema } from "./schemas";
import { registrarTienda } from "./actions";

describe("Registro de Tiendas [RF-VER-01…04, RNF-SEC-03]", () => {
  describe("registroSchema", () => {
    it("valida un formulario de registro completo y correcto", () => {
      const datosValidos = {
        nombre: "Doña Lupe",
        email: "lupe@tienda.com",
        password: "PasswordSegura123!",
        nombreTienda: "Abarrotes Doña Lupe",
        direccion: "Av. Acueducto 123, Morelia",
        telefono: "4431234567",
        lat: 19.7009,
        lng: -101.1804,
        aceptaPrivacidad: "on",
      };
      const res = registroSchema.safeParse(datosValidos);
      expect(res.success).toBe(true);
    });

    it("rechaza teléfonos que no sean de 10 dígitos", () => {
      const datos = {
        nombre: "Doña Lupe",
        email: "lupe@tienda.com",
        password: "PasswordSegura123!",
        nombreTienda: "Abarrotes Doña Lupe",
        direccion: "Av. Acueducto 123",
        telefono: "44312345", // 8 dígitos
        lat: 19.7009,
        lng: -101.1804,
        aceptaPrivacidad: "on",
      };
      const res = registroSchema.safeParse(datos);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toMatch(/10 dígitos/);
      }
    });

    it("rechaza registros sin aceptar el aviso de privacidad", () => {
      const datos = {
        nombre: "Doña Lupe",
        email: "lupe@tienda.com",
        password: "PasswordSegura123!",
        nombreTienda: "Abarrotes Doña Lupe",
        direccion: "Av. Acueducto 123",
        telefono: "4431234567",
        lat: 19.7009,
        lng: -101.1804,
      };
      const res = registroSchema.safeParse(datos);
      expect(res.success).toBe(false);
    });

    it("rechaza ubicaciones con coordenadas fuera de México", () => {
      const datos = {
        nombre: "Doña Lupe",
        email: "lupe@tienda.com",
        password: "PasswordSegura123!",
        nombreTienda: "Abarrotes Doña Lupe",
        direccion: "Av. Acueducto 123",
        telefono: "4431234567",
        lat: 48.8566, // París
        lng: 2.3522,
        aceptaPrivacidad: "on",
      };
      const res = registroSchema.safeParse(datos);
      expect(res.success).toBe(false);
    });
  });

  describe("registrarTienda action", () => {
    it("falla si faltan campos obligatorios en el FormData", async () => {
      const fd = new FormData();
      fd.append("nombre", "Incompleto");
      const res = await registrarTienda(fd);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBeDefined();
      }
    });

    it("falla si faltan los documentos requeridos", async () => {
      const fd = new FormData();
      fd.append("nombre", "Doña Lupe");
      fd.append("email", "lupe@tienda.com");
      fd.append("password", "PasswordSegura123!");
      fd.append("nombreTienda", "Abarrotes Doña Lupe");
      fd.append("direccion", "Av. Acueducto 123, Morelia");
      fd.append("telefono", "4431234567");
      fd.append("lat", "19.7009");
      fd.append("lng", "-101.1804");
      fd.append("aceptaPrivacidad", "on");

      const res = await registrarTienda(fd);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Foto de fachada/);
      }
    });
  });
});
