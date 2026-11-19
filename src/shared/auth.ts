// Configuración de Better Auth (servidor). Dueño: Hiram. Ver docs/SRS.md §3.2.1 (RNF-SEC).
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/shared/db";
import { enviarCorreo } from "@/shared/mail";
import { hashPassword, verifyPassword } from "@/shared/security/password";
import { registrarEvento } from "@/shared/security/audit";
import { estaBloqueada, evaluarIntentoFallido } from "@/shared/security/lockout";
import { errorCredencialesInvalidas } from "@/shared/security/auth-errores";
import { configuracionIpDesdeEnv } from "@/shared/security/ip";

const configIp = configuracionIpDesdeEnv();
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

  // [RNF-SEC-04] Misma política de IP que datosDelRequest(): por defecto no se
  // confía en x-forwarded-for, porque el cliente puede falsificarlo [PR-SEC-10].
  advanced: {
    ipAddress: {
      ipAddressHeaders: configIp.ipHeaders,
      trustedProxies: configIp.trustedProxies,
    },
  },

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

  // [RF-AUT-04 · RN-14] Bloqueo por cuenta con hooks before/after en "/sign-in/email"
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = typeof ctx.body?.email === "string" ? ctx.body.email.toLowerCase().trim() : null;
        if (email) {
          const user = await db.user.findUnique({ where: { email } });
          if (user && estaBloqueada(user.lockedUntil, new Date())) {
            // [RNF-SEC-06] Mismo status/code/message que un login con datos
            // incorrectos: el bloqueo sigue activo pero no revela si el correo
            // existe. ACCOUNT_LOCKED se registra en el hook after al bloquear.
            throw errorCredencialesInvalidas();
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const returned = ctx.context?.returned;
        const email = typeof ctx.body?.email === "string" ? ctx.body.email.toLowerCase().trim() : null;

        if (returned instanceof Error) {
          // Intento fallido
          if (email) {
            const user = await db.user.findUnique({ where: { email } });
            if (user) {
              const ahora = new Date();
              const { intentos, lockedUntil } = evaluarIntentoFallido(user.failedLoginAttempts, ahora);
              await db.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: intentos, lockedUntil },
              });
              await registrarEvento("LOGIN_FAIL", { exito: false, userId: user.id });
              if (lockedUntil) {
                await registrarEvento("ACCOUNT_LOCKED", {
                  exito: false,
                  userId: user.id,
                  detalle: { motivo: "5 intentos fallidos consecutivos", lockedUntil: lockedUntil.toISOString() },
                });
              }
            } else {
              await registrarEvento("LOGIN_FAIL", { exito: false, detalle: { email } });
            }
          }
        } else {
          // Intento exitoso
          const user = (returned as { user?: { id: string } } | undefined)?.user;
          if (user?.id) {
            await db.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: null },
            });
            await registrarEvento("LOGIN_OK", { exito: true, userId: user.id });
          }
        }
      }
    }),
  },

  plugins: [nextCookies()], // nextCookies debe ir al final
});

export type Sesion = typeof auth.$Infer.Session;
