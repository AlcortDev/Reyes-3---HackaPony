"use client";
// [RF-AUT-03] Cerrar sesión (revoca la sesión en el servidor).
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/shared/auth-client";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={saliendo}
      onClick={async () => {
        setSaliendo(true);
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-5" aria-hidden />
      Salir
    </Button>
  );
}
