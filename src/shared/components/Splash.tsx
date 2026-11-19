"use client";
// Splash de bienvenida. Diseño: Sebastían.
// Se muestra una vez por sesión: un script en <head> (ver SCRIPT_SPLASH) marca <html data-splash="si">
// antes de pintar, y el CSS de globals.css la muestra solo con esa marca. Si JS falla, nunca aparece.
import { useEffect } from "react";
import { IconoVaquita } from "./Logo";
import { PapelPicado } from "./PapelPicado";

/** Va inline en <head>: decide antes del primer pintado. Respaldo: se quita sola a los 3.5 s. */
export const SCRIPT_SPLASH = `try{if(!sessionStorage.getItem("vaquita-splash")){sessionStorage.setItem("vaquita-splash","1");var d=document.documentElement;d.dataset.splash="si";setTimeout(function(){d.removeAttribute("data-splash")},3500)}}catch(e){}`;

export function Splash() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.splash !== "si") return;
    const rapido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const salir = setTimeout(() => {
      html.dataset.splash = "saliendo";
    }, rapido ? 600 : 1500);
    const quitar = setTimeout(() => {
      html.removeAttribute("data-splash");
    }, rapido ? 700 : 1950);
    return () => {
      clearTimeout(salir);
      clearTimeout(quitar);
    };
  }, []);

  return (
    <div
      className="splash fixed inset-0 z-[100] flex-col items-center justify-between bg-primary-oscuro text-white"
      aria-hidden="true"
    >
      <PapelPicado className="opacity-95" alto={40} />
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div className="splash-vaca grid size-36 place-items-center rounded-full bg-[#fbf8f1] shadow-[0_10px_40px_-10px_rgb(0_0_0/0.5)] ring-8 ring-white/10">
          <IconoVaquita className="size-24" />
        </div>
        <div className="splash-texto space-y-2">
          <p className="font-display text-5xl leading-none font-extrabold tracking-tight">La Vaquita</p>
          <p className="text-lg text-white/85">Tu tiendita, más fuerte en equipo</p>
        </div>
        <div className="flex gap-2 pt-2" aria-hidden="true">
          <span className="splash-punto size-2.5 rounded-full bg-accent" />
          <span className="splash-punto size-2.5 rounded-full bg-accent" />
          <span className="splash-punto size-2.5 rounded-full bg-accent" />
        </div>
      </div>
      <p className="pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-white/60">Hecho en Morelia · HackaPony 2026</p>
    </div>
  );
}
