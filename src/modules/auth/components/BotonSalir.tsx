"use client";
// [RF-AUT-03] Cerrar sesión (revoca la sesión en el servidor).
import { useRouter } from "next/navigation";
import { authClient } from "@/shared/auth-client";

export function BotonSalir() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="min-h-11 rounded-md px-3 text-sm underline"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
