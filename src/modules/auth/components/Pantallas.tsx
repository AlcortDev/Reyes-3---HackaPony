// Pantallas pendientes del módulo auth. Pantallas: Sebastían · servidor: Hiram (shared/auth.ts).
import { Pendiente } from "@/shared/components";

// TODO(Sebastían) [RF-AUT-05] Pedir correo → authClient.requestPasswordReset({ email, redirectTo: "/restablecer" })
//   (en versiones anteriores de Better Auth se llama authClient.forgetPassword). Mensaje SIEMPRE genérico.
export function RecuperarForm() {
  return <Pendiente titulo="Recuperar contraseña" dueno="Sebastían (UI) · Hiram (servidor)" requisitos="RF-AUT-05" />;
}

// TODO(Sebastían) [RF-AUT-06] Lee ?token= y llama authClient.resetPassword({ newPassword, token }). Usa restablecerSchema.
export function RestablecerForm() {
  return <Pendiente titulo="Poner contraseña nueva" dueno="Sebastían (UI) · Hiram (servidor)" requisitos="RF-AUT-06" />;
}

// TODO(Sebastían) [RF-AUT-02] "Revisa tu correo" + reenviar con authClient.sendVerificationEmail({ email, callbackURL: "/login" })
export function VerificarCorreo() {
  return <Pendiente titulo="Revisa tu correo" dueno="Sebastían" requisitos="RF-AUT-02" />;
}
