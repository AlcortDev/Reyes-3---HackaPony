import { listarVaquitas, VaquitasLista } from "@/modules/vaquitas";

export default async function VaquitasPage() {
  // El layout (app) ya validó la tienda aprobada.
  const vaquitas = await listarVaquitas();
  return <VaquitasLista vaquitas={vaquitas} />;
}
