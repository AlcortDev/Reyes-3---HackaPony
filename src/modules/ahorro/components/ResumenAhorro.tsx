// [RF-AHO-01, RF-AHO-02, RF-AHO-03] Pantalla de ahorro de la tienda y de la colonia. Dueño: Jesús.
import Link from "next/link";
import { formatoMoneda } from "@/shared/utils";
import type { ResumenAhorro as Resumen } from "../queries";

export function ResumenAhorro({
  resumen,
  colonia,
  nombreTienda,
}: {
  resumen: Resumen;
  colonia?: { ahorrado: number; potencial: number };
  nombreTienda?: string;
}) {
  const completas = resumen.detalle.filter((d) => d.estado === "COMPLETA");
  const abiertas = resumen.detalle.filter((d) => d.estado === "ABIERTA");

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary">💰 Mi ahorro</h1>
        <p className="text-xl font-semibold text-primary-oscuro">
          {nombreTienda ? `Margen recuperado por ${nombreTienda}` : "Dinero que se queda en tu tiendita"} al comprar en
          vaquita
        </p>
      </div>

      {/* Tarjeta principal de ahorro de la tienda [RF-AHO-01] */}
      <div className="rounded-2xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-50 to-green-100 p-6 text-center shadow-xs">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-900">
          🎉 Ahorrado en vaquitas completas
        </p>
        <p className="mt-1 text-4xl font-extrabold text-emerald-800">{formatoMoneda(resumen.ahorrado)}</p>
        <p className="mt-1 text-xs text-emerald-900">
          En {completas.length} {completas.length === 1 ? "vaquita completada" : "vaquitas completadas"}
        </p>

        {resumen.potencial > 0 && (
          <div className="mt-4 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-2xs">
            ⏳ + <strong>{formatoMoneda(resumen.potencial)}</strong> de ahorro potencial cuando se completen tus{" "}
            {abiertas.length} {abiertas.length === 1 ? "vaquita abierta" : "vaquitas abiertas"}
          </div>
        )}
      </div>

      {/* Ahorro colectivo de toda la colonia [RF-AHO-03] */}
      {colonia && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">🏘️ Fuerza de la colonia (Chapultepec Norte)</h2>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
              Barrio unido
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">Ahorro total colonia</p>
              <p className="mt-0.5 text-xl font-extrabold text-green-700">{formatoMoneda(colonia.ahorrado)}</p>
            </div>
            <div className="rounded-xl bg-amber-50/70 p-3">
              <p className="text-xs font-medium text-amber-900">En juego (abiertas)</p>
              <p className="mt-0.5 text-xl font-extrabold text-amber-700">{formatoMoneda(colonia.potencial)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Desglose por vaquita [RF-AHO-02] */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">📋 Desglose por vaquita</h2>

        {resumen.detalle.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center space-y-3">
            <p className="text-base font-semibold text-gray-800">
              Todavía no has participado en ninguna vaquita
            </p>
            <p className="text-sm text-gray-600">
              Únete a un pedido grupal con tus vecinos para conseguir precio de Central de Abastos.
            </p>
            <Link
              href="/vaquitas"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white"
            >
              🐄 Ver vaquitas abiertas →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {resumen.detalle.map((item) => {
              const esCompleta = item.estado === "COMPLETA";
              const esAbierta = item.estado === "ABIERTA";
              const ahorroUnit = Math.max(0, item.precioMenudeo - item.precioMayoreo);

              return (
                <li key={item.vaquitaId}>
                  <Link
                    href={`/vaquitas/${item.vaquitaId}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:border-green-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-gray-900">🐄 {item.producto}</p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          Aportaste <strong>{item.cantidad} unidades</strong> ·{" "}
                          <span className="line-through">{formatoMoneda(item.precioMenudeo)}</span> →{" "}
                          <strong className="text-green-700">{formatoMoneda(item.precioMayoreo)}</strong> c/u (ahorras{" "}
                          {formatoMoneda(ahorroUnit)}/u)
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-lg font-extrabold ${
                            esCompleta
                              ? "text-emerald-700"
                              : esAbierta
                                ? "text-amber-700"
                                : "text-gray-400 line-through"
                          }`}
                        >
                          {esCompleta ? "+" : ""}
                          {formatoMoneda(item.ahorro)}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            esCompleta
                              ? "bg-emerald-100 text-emerald-800"
                              : esAbierta
                                ? "bg-amber-100 text-amber-900"
                                : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {esCompleta ? "🎉 Ahorrado" : esAbierta ? "⏳ En progreso" : "🔒 Cerrada"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
