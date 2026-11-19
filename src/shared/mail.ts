// Correos transaccionales. En el MVP van SOLO a Mailpit (http://localhost:8025) [C-08].
import nodemailer from "nodemailer";
import { escaparHtml } from "@/shared/utils";

const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "127.0.0.1", // no "localhost": Node puede resolverlo a IPv6 (::1)
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
});

const REMITENTE = process.env.MAIL_FROM ?? "La Vaquita <no-responder@lavaquita.local>";

export type PlantillaCorreo =
  | "verificacion"
  | "reset"
  | "passwordCambiada"
  | "tiendaAprobada"
  | "tiendaRechazada";

type Datos = Record<string, string>;

const plantillas: Record<PlantillaCorreo, (d: Datos) => { asunto: string; lineas: string[]; boton?: { texto: string; url: string } }> = {
  verificacion: (d) => ({
    asunto: "Confirma tu correo · La Vaquita",
    lineas: [`¡Hola, ${d.nombre}!`, "Confirma tu correo para terminar tu registro."],
    boton: { texto: "Confirmar correo", url: d.url },
  }),
  reset: (d) => ({
    asunto: "Restablece tu contraseña · La Vaquita",
    lineas: [
      `Hola, ${d.nombre}.`,
      "Pediste cambiar tu contraseña. El enlace sirve una sola vez y vence en 15 minutos.",
      "Si no fuiste tú, ignora este correo.",
    ],
    boton: { texto: "Poner contraseña nueva", url: d.url },
  }),
  passwordCambiada: (d) => ({
    asunto: "Tu contraseña cambió · La Vaquita",
    lineas: [
      `Hola, ${d.nombre}.`,
      "Tu contraseña se cambió y cerramos todas tus sesiones abiertas.",
      "Si no fuiste tú, recupera tu cuenta de inmediato.",
    ],
  }),
  tiendaAprobada: (d) => ({
    asunto: "¡Tu tienda fue aprobada! · La Vaquita",
    lineas: [`¡Felicidades, ${d.nombre}!`, `"${d.tienda}" ya puede usar La Vaquita.`],
    boton: { texto: "Entrar", url: d.url },
  }),
  tiendaRechazada: (d) => ({
    asunto: "Revisa los datos de tu tienda · La Vaquita",
    lineas: [
      `Hola, ${d.nombre}.`,
      `No pudimos aprobar "${d.tienda}". Motivo: ${d.motivo}`,
      "Puedes volver a subir tus documentos desde tu perfil.",
    ],
    boton: { texto: "Ir a mi perfil", url: d.url },
  }),
};

export async function enviarCorreo(plantilla: PlantillaCorreo, para: string, datos: Datos): Promise<void> {
  const { asunto, lineas, boton } = plantillas[plantilla](datos);
  const texto = [...lineas, boton ? `${boton.texto}: ${boton.url}` : ""].join("\n\n");
  const html = [
    ...lineas.map((l) => `<p>${escaparHtml(l)}</p>`),
    boton ? `<p><a href="${escaparHtml(boton.url)}">${escaparHtml(boton.texto)}</a></p>` : "",
  ].join("");

  try {
    await transporte.sendMail({ from: REMITENTE, to: para, subject: asunto, text: texto, html });
  } catch (e) {
    // Sin Mailpit levantado: se imprime en consola para no bloquear el desarrollo.
    console.warn(`[mail] No se pudo enviar "${asunto}" a ${para}. ¿Está Mailpit arriba? (npm run db:up)\n${texto}`, e);
  }
}
