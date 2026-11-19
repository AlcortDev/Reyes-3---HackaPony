"use client";
// [RF-AUT-02] "Revisa tu correo" + reenviar el enlace de verificación.
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/shared/auth-client";
import { recuperarSchema } from "../schemas";
import { Aviso } from "./Aviso";

export function VerificarCorreo() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [estado, setEstado] = useState<"inicial" | "enviando" | "enviado" | "error">("inicial");

  async function reenviar() {
    const datos = recuperarSchema.safeParse({ email });
    if (!datos.success) {
      setEstado("error");
      return;
    }
    setEstado("enviando");
    await authClient.sendVerificationEmail({ email: datos.data.email, callbackURL: "/login?aviso=verificado" });
    setEstado("enviado"); // mismo mensaje siempre [RNF-SEC-06]
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="mb-2 size-14 text-secondary" aria-hidden />
        <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
        <CardDescription className="text-base">
          Te mandamos un enlace para confirmar tu cuenta. Ábrelo y luego entra a La Vaquita.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Aviso tipo="info">
          Mientras revisamos tu tienda, solo podrás ver tu perfil. Te avisamos por correo cuando esté aprobada.
        </Aviso>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-base font-semibold">¿No te llegó?</summary>
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground">Revisa la carpeta de spam o pide otro enlace.</p>
            <Label htmlFor="email" className="text-base">
              Correo
            </Label>
            <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
            {estado === "error" && <Aviso tipo="error">Escribe un correo válido.</Aviso>}
            {estado === "enviado" && <Aviso tipo="exito">Si el correo está registrado, te mandamos otro enlace.</Aviso>}
            <Button type="button" variant="outline" className="w-full" onClick={reenviar} disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Mandar otro enlace"}
            </Button>
          </div>
        </details>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Ir a entrar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
