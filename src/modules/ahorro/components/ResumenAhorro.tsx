// [RF-AHO-01, RF-AHO-02] Pantalla de ahorro. Dueño: Jesús.
import { formatoMoneda } from "@/shared/utils";
import type { ResumenAhorro as Resumen } from "../queries";

export function ResumenAhorro({ resumen }: { resumen: Resumen }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Mi ahorro</h1>
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <p className="text-gray-700">Ahorraste comprando en vaquita</p>
        <p className="text-4xl font-bold text-green-700">{formatoMoneda(resumen.ahorrado)}</p>
        {resumen.potencial > 0 && (
          <p className="mt-2 text-sm text-gray-600">+ {formatoMoneda(resumen.potencial)} cuando se completen tus vaquitas abiertas</p>
        )}
      </div>
      {/* TODO(Jesús) [RF-AHO-02] desglose por vaquita */}
    </section>
  );
}
