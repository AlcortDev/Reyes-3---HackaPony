// Contrato Hiram ↔ Sebastían del registro de tienda [RF-VER-01, RF-VER-02].
// Los ARCHIVOS no van aquí: se validan en el servidor con validarArchivo() [RNF-SEC-08].
import { z } from "zod";
import { contrasenaNueva, correo } from "@/modules/auth";

export const pasoCuentaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: correo,
  password: contrasenaNueva,
});

export const pasoTiendaSchema = z.object({
  nombreTienda: z.string().trim().min(2, "Escribe el nombre de tu tienda").max(80),
  direccion: z.string().trim().min(5, "Escribe la dirección").max(200),
  telefono: z.string().trim().regex(/^\d{10}$/, "Teléfono de 10 dígitos"),
});

export const pasoUbicacionSchema = z.object({
  // Rango aproximado de México
  lat: z.coerce.number().min(14).max(33),
  lng: z.coerce.number().min(-118).max(-86),
});

/** Paso 1 · /registro: solo la cuenta. */
export const cuentaSchema = pasoCuentaSchema;

/** Paso 2 · /verificar-tienda (con sesión): tienda + ubicación + aviso de privacidad (los archivos van aparte). */
export const verificacionSchema = pasoTiendaSchema.merge(pasoUbicacionSchema).extend({
  aceptaPrivacidad: z.literal("on", { errorMap: () => ({ message: "Acepta el aviso de privacidad" }) }),
});

/** Nombres de los campos de archivo en el FormData del registro. */
export const CAMPOS_DOCUMENTO = {
  FACHADA: "fachada",
  COMPROBANTE_DOMICILIO: "comprobante",
  IDENTIFICACION: "identificacion",
} as const;

export const motivoSchema = z.string().trim().min(5, "Escribe el motivo").max(500);
