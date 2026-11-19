import { RegistroCuenta } from "@/modules/tiendas";

export const metadata = { title: "Crear cuenta" };

// Paso 1: solo la cuenta. La tienda se verifica después, con sesión, en /verificar-tienda.
export default function RegistroPage() {
  return <RegistroCuenta />;
}
