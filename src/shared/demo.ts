"use server";
// [RF-DEM-02] Reiniciar demo. Dueño: Hiram (Bloque 3).
import type { Resultado } from "@/shared/types";
import { assertAdmin } from "@/shared/security/guards";

export async function reiniciarDemo(): Promise<Resultado> {
  await assertAdmin();
  // TODO(Hiram) [RF-DEM-02] Volver a cargar inventario, movimientos y vaquitas del seed
  //   SIN borrar cuentas (User/Account) ni tiendas aprobadas.
  return { ok: false, error: "Reiniciar demo todavía no está implementado" };
}
