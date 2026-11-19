// Contrato Hiram ↔ Sebastían: lo usan los formularios (cliente) y el servidor. [RNF-SEC-02, RNF-SEC-03]
import { z } from "zod";

export const correo = z.string().trim().toLowerCase().email("Escribe un correo válido").max(254);

export const contrasenaNueva = z
  .string()
  .min(12, "Usa al menos 12 caracteres")
  .max(128, "Máximo 128 caracteres");

export const loginSchema = z.object({
  email: correo,
  password: z.string().min(1, "Escribe tu contraseña").max(128),
});

export const recuperarSchema = z.object({ email: correo });

export const restablecerSchema = z
  .object({
    password: contrasenaNueva,
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" });

export type LoginInput = z.infer<typeof loginSchema>;
