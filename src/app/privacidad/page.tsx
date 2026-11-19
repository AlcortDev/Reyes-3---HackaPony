// [RF-TIE-03 · RNF-SEC-14] Aviso de privacidad. Dueño: Sebastían.
// Texto de prototipo (proyecto académico HackaPony 2026); en producción lo revisa un abogado.
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/shared/components";

export const metadata: Metadata = { title: "Aviso de privacidad · La Vaquita" };

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <div className="space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 pb-12">
      <header className="flex items-center justify-between py-4">
        <Link href="/login" aria-label="Ir a La Vaquita">
          <Logo />
        </Link>
      </header>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold">Aviso de privacidad</h1>
        <p className="text-muted-foreground">Versión de prototipo · noviembre de 2026</p>
      </div>

      <Seccion titulo="¿Quién cuida tus datos?">
        <p>
          El equipo REYES, responsable del prototipo <strong>La Vaquita</strong> (proyecto académico del Instituto Tecnológico de
          Morelia, HackaPony 2026), es quien trata los datos personales que nos compartes.
        </p>
      </Seccion>

      <Seccion titulo="¿Qué datos pedimos?">
        <ul className="list-disc space-y-1 pl-6">
          <li>Tu nombre, correo y teléfono.</li>
          <li>Nombre, dirección y ubicación en el mapa de tu tienda.</li>
          <li>Una foto de la fachada de la tienda.</li>
          <li>Un comprobante de domicilio.</li>
          <li>Una identificación oficial (INE) de la persona dueña.</li>
        </ul>
        <p>Tu contraseña nunca la guardamos tal cual: solo guardamos una huella cifrada que no se puede revertir.</p>
      </Seccion>

      <Seccion titulo="¿Para qué los usamos?">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Confirmar que tu tienda existe</strong> antes de darte acceso, para que las demás tiendas de la colonia puedan confiar
            en quién entra a las vaquitas.
          </li>
          <li>Darte acceso a tu cuenta y avisarte por correo de cambios importantes (aprobación, cambio de contraseña).</li>
          <li>Mostrar a las otras tiendas el nombre de tu tienda y cuánto aportas a cada vaquita.</li>
        </ul>
        <p>No vendemos ni rentamos tus datos, y no los usamos para publicidad.</p>
      </Seccion>

      <Seccion titulo="¿Quién puede ver tus documentos?">
        <p>
          Tu INE, tu comprobante y la foto de tu fachada <strong>solo los ve el administrador</strong> que revisa tu solicitud, y tú
          mismo desde tu perfil. Las otras tiendas nunca los ven. Se guardan <strong>cifrados</strong> y cada vez que alguien los abre
          queda registrado.
        </p>
      </Seccion>

      <Seccion titulo="¿Cuánto tiempo los guardamos?">
        <p>
          Mientras tu cuenta esté activa. Si tu solicitud es rechazada y no vuelves a enviarla, podemos borrar tus documentos. Puedes
          pedirnos que borremos tu cuenta y tus documentos en cualquier momento.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos (ARCO)">
        <p>
          Puedes pedirnos <strong>acceder</strong> a tus datos, <strong>corregirlos</strong>, <strong>cancelarlos</strong> u{" "}
          <strong>oponerte</strong> a su uso, conforme a la legislación mexicana de protección de datos personales. Escríbenos a{" "}
          <span className="font-semibold">privacidad@lavaquita.local</span> desde el correo de tu cuenta.
        </p>
      </Seccion>

      <p className="border-t pt-6">
        <Link href="/registro" className="text-primary underline underline-offset-4">
          Volver al registro
        </Link>
      </p>
    </main>
  );
}
