// [RF-INV-01, RF-INV-04] Lista de productos con semáforo. Dueño: Alvaro.
// TODO(Alvaro): tarjetas con botones grandes + / − (client component que llame a registrarMovimiento).
import type { ItemInventarioDTO, NivelStock } from "../types";

const SEMAFORO: Record<NivelStock, { icono: string; texto: string; clase: string }> = {
  critico: { icono: "🔴", texto: "Urge surtir", clase: "border-red-500" },
  bajo: { icono: "🟡", texto: "Pendiente", clase: "border-yellow-500" },
  ok: { icono: "🟢", texto: "Bien", clase: "border-green-500" },
};

export function InventarioLista({ items }: { items: ItemInventarioDTO[] }) {
  const porAgotarse = items.filter((i) => i.nivel === "critico").length;
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Mi inventario</h1>
      {porAgotarse > 0 && (
        <p className="rounded-md bg-red-50 p-3 font-semibold text-red-700">
          ⚠️ Tienes {porAgotarse} producto{porAgotarse === 1 ? "" : "s"} por agotarse
        </p>
      )}
      <ul className="space-y-2">
        {items.map((i) => {
          const s = SEMAFORO[i.nivel];
          return (
            <li key={i.id} className={`flex items-center justify-between rounded-lg border-l-8 bg-white p-4 shadow-sm ${s.clase}`}>
              <div>
                <p className="font-semibold">{i.nombre}</p>
                <p className="text-sm text-gray-600">
                  {s.icono} {s.texto} · mínimo {i.stockMinimo}
                </p>
              </div>
              <p className="text-3xl font-bold">{i.stock}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
