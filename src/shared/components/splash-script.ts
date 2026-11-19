// Cadena disponible en el servidor: no importar este bootstrap desde un módulo use client.
/** Va inline en <head>: decide antes del primer pintado. Respaldo: se quita sola a los 3.5 s. */
export const SCRIPT_SPLASH = `try{if(!sessionStorage.getItem("vaquita-splash")){sessionStorage.setItem("vaquita-splash","1");var d=document.documentElement;d.dataset.splash="si";setTimeout(function(){d.removeAttribute("data-splash")},3500)}}catch(e){}`;
