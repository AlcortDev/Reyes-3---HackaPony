// [RF-VAQ-01] Lista de vaquitas con barra de progreso. Dueño: Jesús.
import Link from "next/link";
import { formatoMoneda } from "@/shared/utils";
import type { VaquitaDTO } from "../types";

export function BarraVaquita({ v }: { v: VaquitaDTO }) {
  return (
    <div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={v.porcentaje} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-green-600 transition-all" style={{ width: `${v.porcentaje}%` }} />
      </div>
      <p className="mt-1 text-sm">
        {v.totalAportado}/{v.metaUnidades} ({v.porcentaje}%) · faltan <strong>{v.faltan}</strong>
      </p>
    </div>
  );
}

export function VaquitasLista({ vaquitas }: { vaquitas: VaquitaDTO[] }) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Vaquitas de la colonia</h1>
      <ul className="space-y-3">
        {vaquitas.map((v) => (
          <li key={v.id}>
            <Link href={`/vaquitas/${v.id}`} className="block rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold">🐄 {v.producto}</p>
              <p className="text-sm text-gray-600">
                {formatoMoneda(v.precioMenudeo)} → <strong>{formatoMoneda(v.precioMayoreo)}</strong> · {v.proveedor}
              </p>
              <div className="mt-2">
                <BarraVaquita v={v} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
