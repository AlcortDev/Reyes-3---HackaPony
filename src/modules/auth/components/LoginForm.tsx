"use client";
// [RF-AUT-01] Inicio de sesión. Diseño: Sebastían · servidor: Better Auth (Hiram).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/shared/auth-client";
import { destinoSeguro } from "../destino";
import { loginSchema } from "../schemas";
import { Aviso } from "./Aviso";
import { CampoContrasena } from "./CampoContrasena";

const AVISOS_URL: Record<string, string> = {
  verificado: "¡Listo! Tu correo quedó confirmado. Ya puedes entrar.",
  restablecida: "Tu contraseña cambió. Entra con la nueva.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const aviso = AVISOS_URL[params.get("aviso") ?? ""];
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const datos = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? "Revisa tus datos");
      return;
    }

    setCargando(true);
    const { error } = await authClient.signIn.email(datos.data);
    setCargando(false);

    if (error) {
      // Mensajes genéricos: no revelan si el correo existe [RNF-SEC-06]
      if (error.status === 403 && /verif/i.test(error.message ?? "")) {
        setError("Confirma tu correo primero. Revisa tu bandeja de entrada.");
      } else if (error.status === 429 || error.status === 423 || error.status === 403) {
        setError("Demasiados intentos. Espera unos minutos y vuelve a intentar.");
      } else {
        setError("Correo o contraseña incorrectos");
      }
      return;
    }
    // A donde iba (ej. el QR de una vaquita) o a la raíz, que redirige según rol y estatus.
    // Si su tienda no está aprobada, el layout protegido lo manda a /perfil de todos modos.
    router.replace(destinoSeguro(params.get("siguiente"), window.location.origin));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">¡Qué gusto verte!</CardTitle>
        <CardDescription className="text-base">Entra para ver tu inventario y tus vaquitas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Correo
            </Label>
            <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} />
          </div>
          <CampoContrasena id="password" name="password" etiqueta="Contraseña" autoComplete="current-password" />
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Button type="submit" size="lg" className="w-full" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
          </Button>
          <p className="text-center">
            <Link href="/recuperar" className="text-link underline underline-offset-4">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>
        <div className="mt-6 border-t pt-6 text-center">
          <p className="text-muted-foreground">¿Tu tienda todavía no está en La Vaquita?</p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href="/registro">Crear cuenta para mi tienda</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
