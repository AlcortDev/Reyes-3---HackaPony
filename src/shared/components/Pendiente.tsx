// Marcador para pantallas que aún no se construyen. Bórralo de tu pantalla cuando la termines.
export function Pendiente({ titulo, dueno, requisitos }: { titulo: string; dueno: string; requisitos: string }) {
  return (
    <section className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
      <h1 className="text-xl font-bold">{titulo}</h1>
      <p className="mt-2 text-gray-600">
        Por construir · dueño: <strong>{dueno}</strong>
      </p>
      <p className="mt-1 text-sm text-gray-500">Requisitos: {requisitos} (ver docs/SRS.md)</p>
    </section>
  );
}
