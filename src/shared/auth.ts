// Configuración de Better Auth (servidor). Dueño: Hiram. Ver docs/SRS.md §3.2.1 (RNF-SEC).
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/shared/db";
import { enviarCorreo } from "@/shared/mail";
import { hashPassword, verifyPassword } from "@/shared/security/password";
import { registrarEvento } from "@/shared/security/audit";

const origenesExtra = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // CSRF: solo se aceptan peticiones de estos orígenes [RNF-SEC-07]. Agrega la IP de la laptop de demo en TRUSTED_ORIGINS.
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000", ...origenesExtra],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // [RF-AUT-02]
    minPasswordLength: 12, // [RNF-SEC-02]
    maxPasswordLength: 128,
    password: {
      hash: hashPassword, // Argon2id [RNF-SEC-01]
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
    resetPasswordTokenExpiresIn: 60 * 15, // 15 min [RF-AUT-06]
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await enviarCorreo("reset", user.email, { nombre: user.name, url });
      await registrarEvento("RESET_REQUESTED", { exito: true, userId: user.id });
    },
    onPasswordReset: async ({ user }) => {
      await enviarCorreo("passwordCambiada", user.email, { nombre: user.name });
      await registrarEvento("RESET_DONE", { exito: true, userId: user.id });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await enviarCorreo("verificacion", user.email, { nombre: user.name, url });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // se renueva cada día
  },

  // [RNF-SEC-04] Límite por IP guardado en BD (tabla rateLimit)
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/forget-password": { window: 3600, max: 3 },
      "/request-password-reset": { window: 3600, max: 3 },
    },
  },

  user: {
    // input: false → el cliente NUNCA puede mandar estos campos [RNF-SEC-10, PR-SEC-16]
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "TENDERO", input: false },
      failedLoginAttempts: { type: "number", required: false, defaultValue: 0, input: false },
      lockedUntil: { type: "date", required: false, input: false },
    },
  },

  // TODO(Hiram) [RF-AUT-04 · RN-14] Bloqueo por cuenta con hooks before/after en "/sign-in/email"
  //   usando createAuthMiddleware (better-auth/api) + evaluarIntentoFallido / estaBloqueada
  //   de shared/security/lockout.ts, y registrar LOGIN_OK / LOGIN_FAIL / ACCOUNT_LOCKED.
  // TODO(Hiram) [RF-AUT-08 · COULD] plugin haveIBeenPwned() de "better-auth/plugins".

  plugins: [nextCookies()], // nextCookies debe ir al final
});

export type Sesion = typeof auth.$Infer.Session;
