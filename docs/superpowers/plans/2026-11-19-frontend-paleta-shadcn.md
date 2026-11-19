# Paleta y frontend móvil de inventario

**Objetivo:** centralizar los cinco colores solicitados, consumirlos desde Tailwind 4 y shadcn, y entregar un mockup móvil basado en los componentes reales.

**Referencia:** solicitud del usuario; docs/SRS.md RF-INV-01…10 y RNF-01…05. La captura mencionada como Image #1 no está adjunta: la distribución parte del inventario actual y queda pendiente contrastarla con esa imagen.

**Alcance autorizado:** tema global, componentes shadcn necesarios y componentes de inventario. Se avisa en la conversación del cambio en archivos compartidos. No cambian contratos, esquema ni reglas de movimientos.

## Diseño

- Mantener la estructura móvil: encabezado de tienda, título, aviso de stock, búsqueda, filtro, lector, tarjetas y navegación inferior.
- Superficies claras, bordes suaves, cifras de stock grandes y acciones táctiles de al menos 44 px.
- Conservar exactamente la paleta en tokens de marca: primario #23C71F, secundario #276E29, foreground de marca #D6F2CB, acento #2479B5 y acento fuerte #4B6194.
- Mapear colores de marca a roles semánticos. El foreground de marca es una superficie clara; el texto general usa un neutro oscuro para contraste. Sobre el verde primario usar texto oscuro (blanco solo alcanza 2.27:1).
- Semáforo con tokens de éxito, advertencia y peligro, siempre con texto e icono.
- Reutilizar Button, Card, Badge, Input y Alert. Añadir Checkbox, Field, InputGroup, Separator y Empty desde el registro oficial configurado.

## Pasos

- [x] Consultar CLI/documentación oficial y comprobar la suite de interfaz existente.
- [x] Instalar únicamente los componentes faltantes y revisar archivos/dependencias.
- [x] Centralizar tokens en globals.css y exponerlos mediante @theme inline.
- [x] Sustituir el CSS local de colores y controles de inventario por componentes y utilidades semánticas Tailwind.
- [x] Revisar el DOM del resto de módulos y documentar oportunidades sin reescribirlos.
- [x] Generar HTML y PNG de mockup con fixtures identificadas, sin pagos ni movimientos reales.
- [x] Ejecutar pruebas existentes, typecheck, lint, build y revisar la vista a 360/390 px y laptop.

## Revisión

Comprobar nombres accesibles, estados de stock cero, filtros y lector, mensajes de operación incierta, reflujo de etiquetas largas y contraste de controles/foco. El mockup es una vista de diseño sin persistencia; no sustituye las pruebas funcionales.

## Integración y cierre

- Se actualizó desde main antes del commit base (sin novedades entonces). Una segunda actualización trajo e230d9d, integrado en e959864 con sus cambios de identidad y layout preservados.
- Commit base: 59372a1 (tokens y componentes shadcn).
- La revisión independiente detectó y se corrigieron hover secundario, reserva del área segura y bootstrap de splash importado desde un módulo cliente.
- El mockup pasó la comprobación de navegador en 360/390/1280 px y el visor Superpowers respondió HTTP 200 con la pantalla interactiva.
- La cuenta local de diseño quedó creada y el usuario confirmó el inicio de sesión en localhost:3001. No se repite esa prueba ni se cambia su instancia activa.
