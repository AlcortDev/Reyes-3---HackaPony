// [RF-TIE-03 · RNF-SEC-14] Aviso de privacidad. Dueño: Sebastían (texto final).
import { Pendiente } from "@/shared/components";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <Pendiente titulo="Aviso de privacidad" dueno="Sebastían" requisitos="RF-TIE-03, RNF-SEC-14" />
      {/* TODO(Sebastían): qué datos pedimos (INE, comprobante, fachada, ubicación), para qué (verificar que la
          tienda existe), quién los ve (solo el administrador), cuánto tiempo se guardan y cómo pedir su borrado. */}
    </main>
  );
}
