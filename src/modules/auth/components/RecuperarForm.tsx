"use client";
// [RF-AUT-05] Pedir enlace para cambiar la contraseña. Mensaje SIEMPRE genérico [RNF-SEC-06].
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/shared/auth-client";
import { recuperarSchema } from "../schemas";
import { Aviso } from "./Aviso";

export function RecuperarForm() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const datos = recuperarSchema.safeParse({ email: new FormData(e.currentTarget).get("email") });
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? "Escribe un correo válido");
      return;
    }
    setCargando(true);
    const { error } = await authClient.requestPasswordReset({ email: datos.data.email, redirectTo: "/restablecer" });
    setCargando(false);
    if (error?.status === 429) {
      setError("Demasiadas solicitudes. Espera un rato y vuelve a intentar.");
      return;
    }
    setEnviado(true); // aunque el correo no exista: no revelamos nada
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription className="text-base">Te mandamos un enlace a tu correo para poner una nueva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {enviado ? (
          <Aviso tipo="exito">
            Si el correo está registrado, te enviamos un enlace. <strong>Sirve una sola vez y vence en 15 minutos.</strong>
          </Aviso>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Correo con el que te registraste
              </Label>
              <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} />
            </div>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <Button type="submit" size="lg" className="w-full" disabled={cargando}>
              {cargando ? "Enviando…" : "Mandarme el enlace"}
            </Button>
          </form>
        )}
        <p className="text-center">
          <Link href="/login" className="text-accent underline underline-offset-4">
            Volver a entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
