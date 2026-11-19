// [RF-VER-01…03] Registro en 4 pasos. Dueño: Sebastían (UI) · servidor: registrarTienda (Hiram).
//
// TODO(Sebastían):
//   - "use client", 4 pasos con barra de progreso; un solo <form> que se envía al final con FormData
//   - Paso 1 pasoCuentaSchema · Paso 2 pasoTiendaSchema · Paso 3 mapa · Paso 4 documentos + aviso de privacidad
//   - Paso 3: SelectorUbicacion con react-leaflet (importar con next/dynamic y ssr: false; importar "leaflet/dist/leaflet.css")
//     botón "Usar mi ubicación" (navigator.geolocation) + pin arrastrable; inputs ocultos lat/lng
//     Ojo: en celular por http://IP no hay geolocalización → el pin se pone a mano
//   - Paso 4: <input type="file" name={CAMPOS_DOCUMENTO.FACHADA} accept="image/*" capture="environment">
//             comprobante e identificación: accept="image/*,application/pdf"
//   - Enviar a registrarTienda(formData) y redirigir a /verificar-correo
import { Pendiente } from "@/shared/components";

export function RegistroWizard() {
  return <Pendiente titulo="Registra tu tienda" dueno="Sebastían (UI) · Hiram (servidor)" requisitos="RF-VER-01…04" />;
}
