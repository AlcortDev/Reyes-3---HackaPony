// Endpoints de Better Auth (/api/auth/sign-in/email, /sign-out, /reset-password, /verify-email…)
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/shared/auth";

export const { GET, POST } = toNextJsHandler(auth);
