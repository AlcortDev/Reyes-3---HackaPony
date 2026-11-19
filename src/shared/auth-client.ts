// Cliente de Better Auth para los formularios (login, logout, recuperar, restablecer, reenviar verificación).
// Úsalo SOLO desde componentes "use client".
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
