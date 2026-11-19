// [RNF-SEC-04] Límite de intentos para server actions propias (registro, re-subida de documentos).
// Los endpoints de Better Auth usan su propio rateLimit (ver shared/auth.ts).
import { db } from "@/shared/db";

/** Devuelve true si se permite el intento. Ventana fija por clave (ej. "registro:<ip>"). */
export async function limitarIntentos(clave: string, max: number, ventanaSegundos: number): Promise<boolean> {
  const ahora = new Date();
  return db.$transaction(async (tx) => {
    const registro = await tx.limiteIntentos.findUnique({ where: { clave } });

    if (!registro || ahora.getTime() - registro.ventanaIn.getTime() > ventanaSegundos * 1000) {
      await tx.limiteIntentos.upsert({
        where: { clave },
        create: { clave, intentos: 1, ventanaIn: ahora },
        update: { intentos: 1, ventanaIn: ahora },
      });
      return true;
    }
    if (registro.intentos >= max) return false;

    await tx.limiteIntentos.update({ where: { clave }, data: { intentos: { increment: 1 } } });
    return true;
  });
}
