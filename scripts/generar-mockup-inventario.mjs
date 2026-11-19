import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
// Usar el tooling ya instalado con tsx y Tailwind; compatible con npm y pnpm.
const { build } = createRequire(require.resolve("tsx"))("esbuild");
const postcss = createRequire(require.resolve("@tailwindcss/postcss"))("postcss");
const tailwind = require("@tailwindcss/postcss");

const mocks = {
  "@/shared/components": `export {IconoVaquita,Logo} from "@/shared/components/Logo";
    export {NavLateral} from "@/shared/components/Navbar";
    export {PapelPicado} from "@/shared/components/PapelPicado";`,
  "next/link": `import React from "react";
    export default function Link({href,children,onClick,...props}) {
      return React.createElement("a",{...props,href:"#"+href,onClick:event=>{
        onClick?.(event); if(!event.defaultPrevented){event.preventDefault();location.hash=href;}
      }},children);
    }`,
  "next/image": `import React from "react";
    export default function Image({unoptimized,...props}) {return React.createElement("img",props)}`,
  "next/navigation": `import {useSyncExternalStore} from "react";
    const subscribe=callback=>{addEventListener("hashchange",callback);return()=>removeEventListener("hashchange",callback)};
    export function usePathname(){return useSyncExternalStore(subscribe,()=>location.hash.slice(1)||"/inventario")}
    export function useRouter(){return {refresh(){},push(path){location.hash=path}}}`,
  "@/modules/auth": `import React from "react";
    import {Button} from "@/components/ui/button";
    export function BotonSalir(){return React.createElement(Button,{disabled:true,variant:"ghost",size:"sm"},"Demo")}`,
  "../actions": `export const ajustarExistencias=registrarMovimiento;
    export async function registrarMovimiento(){
    return {ok:false,error:"Esta vista de diseño no registra movimientos. Abre la aplicación para vender o surtir."}
  }`,
  "../codigos": `export async function buscarInventarioPorCodigo(codigo){
    return codigo==="DEMO-COCA"?{ok:true,data:{inventarioId:"inv-1"}}:{ok:false,error:"Prueba con DEMO-COCA en esta vista de diseño."}
  }`,
};

const bundle = await build({
  absWorkingDir: root,
  entryPoints: ["scripts/mockups/inventario.tsx"],
  bundle: true, write: false, minify: true, platform: "browser", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "mockup-sin-servidor",
    setup(builder) {
      builder.onResolve({ filter: /^(next\/(link|image|navigation)|@\/modules\/auth|@\/shared\/components|\.\.\/(actions|codigos))$/ }, args =>
        Object.hasOwn(mocks, args.path) ? { path: args.path, namespace: "mockup" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "mockup" }, args => ({ contents: mocks[args.path], resolveDir: root, loader: "jsx" }));
    },
  }],
});
const stylesheet = await postcss([tailwind({ base: root })]).process(
  await readFile(path.join(root, "src/app/globals.css"), "utf8"),
  { from: path.join(root, "src/app/globals.css") },
);

// Incluir Nunito si el build de Next ya descargó la fuente. Sin peticiones externas.
let fontCSS = "";
const embeddedFonts = new Set();
try {
  const cssDir = path.join(root, ".next/static/css");
  for (const name of await readdir(cssDir)) {
    if (!name.endsWith(".css")) continue;
    const css = await readFile(path.join(cssDir, name), "utf8");
    for (const face of css.match(/@font-face\{[^}]*font-family:[^;}]*(?:Nunito|Baloo)[^}]*\}/g) || []) {
      const match = face.match(/url\(([^)]+\.woff2)\)/);
      if (!match) continue;
      const fontPath = match[1].replaceAll('"', "").replaceAll("'", "");
      const absolute = fontPath.startsWith("/_next/")
        ? path.join(root, ".next", fontPath.slice("/_next/".length))
        : path.resolve(cssDir, fontPath);
      const font = await readFile(absolute);
      const family = face.includes("Nunito") ? "Nunito" : "Baloo";
      embeddedFonts.add(family);
      fontCSS += face.replace(/font-family:[^;]+;/, `font-family:"${family} mockup";`)
        .replace(match[0], `url(data:font/woff2;base64,${font.toString("base64")})`);
    }
  }
} catch { /* El mockup usa la fuente de sistema si todavía no hay build local. */ }
// Conservar las fuentes ya incluidas si la instancia dev no tiene CSS de build.
if (!fontCSS) {
  try {
    const previous = await readFile(path.join(root, "docs/design/mockup-inventario.html"), "utf8");
    const faces = previous.match(/@font-face\{[^}]*font-family:"(?:Nunito|Baloo) mockup"[^}]*\}/g) || [];
    fontCSS = [...new Set(faces)].join("");
    for (const face of faces) embeddedFonts.add(face.includes("Nunito") ? "Nunito" : "Baloo");
  } catch { /* Primera generación sin build: fuente de sistema. */ }
}
if (embeddedFonts.has("Nunito")) fontCSS += ':root{--font-nunito:"Nunito mockup"}';
if (embeddedFonts.has("Baloo")) fontCSS += ':root{--font-baloo:"Baloo mockup"}';
const script = bundle.outputFiles[0].text.replaceAll("</script", "<\\/script");
const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>La Vaquita · Mockup móvil</title>
<style>${stylesheet.css}${fontCSS}</style></head><body class="min-h-dvh antialiased">
<div id="mockup"></div><noscript>Activa JavaScript para ver el mockup.</noscript>
<script>if(navigator.mediaDevices){navigator.mediaDevices.getUserMedia=async()=>{throw new Error("Cámara desactivada en el mockup")}}</script>
<script>${script}</script></body></html>`;
const output = path.join(root, "docs/design/mockup-inventario.html");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Mockup generado: ${path.relative(root, output)} (${Math.round(Buffer.byteLength(html)/1024)} KB). Datos de ejemplo; ninguna conexión a la base de datos.`);
