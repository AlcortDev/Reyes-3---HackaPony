// [RNF-SEC-01] Hash de contraseñas con Argon2id (OWASP Password Storage Cheat Sheet).
// @node-rs/argon2 usa Argon2id por defecto.
import { hash, verify } from "@node-rs/argon2";

const OPCIONES = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, OPCIONES);
}

export async function verifyPassword(hashGuardado: string, password: string): Promise<boolean> {
  try {
    return await verify(hashGuardado, password);
  } catch {
    return false;
  }
}
