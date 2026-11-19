# Diseño móvil de La Vaquita

## Paleta y tokens

La fuente única es `src/app/globals.css`. Tailwind 4 expone las variables mediante `@theme inline`; no se necesita `tailwind.config.js`.

| Marca | Hex exacto | CSS | Utilidad de marca |
| --- | --- | --- | --- |
| Primario | #23C71F | `--brand-primary` | `bg-brand-primary` |
| Secundario | #276E29 | `--brand-secondary` | `text-brand-secondary` |
| Foreground de marca | #D6F2CB | `--brand-foreground` | `bg-brand-foreground` |
| Acento | #2479B5 | `--brand-accent` | `text-brand-accent` |
| Acento fuerte | #4B6194 | `--brand-accent-strong` | `text-brand-accent-strong` |

En la aplicación se prefieren los roles semánticos:

| Uso | Tailwind |
| --- | --- |
| Fondo y texto general | `bg-background text-foreground` |
| Acción principal | `bg-primary text-primary-foreground` |
| Verde oscuro | `bg-secondary text-secondary-foreground` |
| Superficie verde clara | `bg-surface-highlight text-surface-highlight-foreground` |
| Acción azul | `bg-accent text-accent-foreground hover:bg-accent-strong` |
| Enlace legible sobre fondo crema | `text-link` |
| Texto de apoyo | `text-muted-foreground` |
| Aviso informativo | `bg-info-surface text-accent-strong` |
| Semáforo | `text-success`, `text-warning`, `text-destructive` |
| Superficies de estado | `bg-success-surface`, `bg-warning-surface`, `bg-destructive-surface` |
| Bordes, entrada y foco | `border-border`, `border-input`, `ring-ring` |

El nombre **foreground de marca** se conserva como `--brand-foreground`. `--foreground` es texto oscuro: usar #D6F2CB como texto sobre blanco impediría leer la app. El texto del botón verde también es oscuro: contraste calculado 5.68:1; blanco sobre ese verde solo alcanza 2.27:1. Blanco sobre secundario, acento y acento fuerte alcanza 6.27:1, 4.69:1 y 6.11:1, respectivamente.

Se conserva la identidad actualizada de main e230d9d: Nunito para lectura, Baloo 2 para títulos, textura de papel, papel picado, splash, vaquita central en la navegación móvil y menú lateral con dos columnas en PC. Las tarjetas jerarquizan producto, estado, existencias y acciones; el color de estado siempre se acompaña de icono y texto. Controles de 44 px o más y base de 16 px, conforme a RNF-01…05.

## Revisión de componentes React

| Elemento existente | Componente shadcn | Aplicación |
| --- | --- | --- |
| Botones de venta/surtido, lector y cantidades | `Button` | Inventario |
| Contenedores de producto y oportunidad de vaquita | `Card` con header/content/footer | Inventario |
| Indicadores de existencias | `Badge` con variantes success/warning/critical | Inventario |
| Avisos de stock, errores y cámara | `Alert` | Inventario |
| Búsqueda con icono | `InputGroup` y `InputGroupInput` | Inventario |
| Filtro Por surtir | `Checkbox`, `Field`, `FieldLabel` | Inventario |
| Captura de cantidad/código | `Input`, `FieldGroup`, `Field` | Inventario |
| Líneas divisorias | `Separator` | Inventario |
| Sin productos o resultados | `Empty` | Inventario |
| Formularios de auth, tiendas y admin | Ya usan Button/Input/Card en varios casos | Ajustes de color para conservar contraste al cambiar el tema |
| Botones, tarjetas, indicadores y formularios propios de vaquitas | Candidatos: Button, Card, Badge, Alert, Field, Input y Select | Pendiente de migración del módulo de Jesús; no se modifica su comportamiento |
| Avisos propios de auth/perfil | Candidatos: Alert | Pendiente de migración; color semántico actualizado |
| Checkbox de privacidad | Candidato: Checkbox | Pendiente: conservar envío FormData y validación de registro |
| Entrada de archivo y campos hidden | Mantener elementos nativos | Necesarios para archivos/formularios |
| Lista de movimientos y navegación de rutas | Mantener ul/li/time/nav/Link | Semántica apropiada; no convertir navegación en Tabs |

Nuevos componentes oficiales: **Checkbox, Field, InputGroup, Separator y Empty**. Se generaron con el CLI de shadcn y se adaptaron a la utilidad `cn` del proyecto y a sus tamaños táctiles. No requieren dependencias nuevas: Radix, Lucide y class-variance-authority ya estaban instalados. Se conservan los controles del equipo y sus variantes.

## Referencias

- [Theming de shadcn](https://ui.shadcn.com/docs/theming): colores por rol y pares background/foreground.
- [Variables de tema de Tailwind 4](https://tailwindcss.com/docs/theme): variables CSS y utilidades semánticas.
- [InputGroup](https://ui.shadcn.com/docs/components/radix/input-group), [Field](https://ui.shadcn.com/docs/components/radix/field), [Checkbox](https://ui.shadcn.com/docs/components/radix/checkbox), [Empty](https://ui.shadcn.com/docs/components/radix/empty).

La captura indicada como «Image #1» no llegó adjunta. Esta propuesta parte de la distribución del inventario existente; su coincidencia con esa captura está pendiente.

## Mockup y verificación

- `mockup-inventario.html`: vista interactiva independiente. Abrir en el navegador; búsqueda, filtro, detalle y lector manual funcionan con fixtures. Los movimientos están bloqueados y la cámara no solicita permisos.
- `mockup-inventario-360.png`, `mockup-inventario-390.png`, `mockup-detalle-390.png`: capturas reales del mockup en Chromium.
- Regenerar: `node scripts/generar-mockup-inventario.mjs`. Usa el tooling existente de tsx/Tailwind y reutiliza los componentes reales. Incluye Nunito y Baloo 2 si existen en el build local; no consulta servicios externos al abrirse.
- Visor Superpowers: sesión local bajo `.superpowers/`, ignorada por Git. La URL de sesión se comparte solo en la conversación, no en el repositorio. Se verificó HTTP 200 y la vista interactiva a pantalla completa.
- QA: 360, 390 y 1280 px sin desbordamiento; objetivos táctiles ≥44 px y texto ≥16 px; búsqueda/filtro/estado vacío, cantidades sin persistencia y lector manual; ninguna petición externa ni error de JavaScript en el mockup.
- Integración: main e230d9d incorporado en e959864; revisión independiente sin regresiones de handlers ni contratos. Corregidos el hover secundario (fondo opaco con contraste), la reserva del área segura inferior y la frontera servidor/cliente del bootstrap del splash.
- `npm run typecheck`, `npm run lint`, `npm test`: 102 pruebas aprobadas y siete pruebas de base real omitidas por su configuración habitual. El build integrado pasó. Las cámaras físicas no forman parte de esta comprobación de diseño.

El usuario de pruebas solicitado se creó exclusivamente en PostgreSQL local, con tienda aprobada y diez productos de ejemplo. Las credenciales no se incluyen en este repositorio. La instancia utilizada por el usuario es `http://localhost:3001`.
