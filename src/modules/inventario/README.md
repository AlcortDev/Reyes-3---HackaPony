# Inventario — Alvaro

Módulo para consultar existencias y registrar ventas/surtidos desde el celular. Implementa RF-INV-01…10 e integra las acciones públicas de vaquitas incluidas en develop. Las consultas de la aplicación usan PostgreSQL mediante Prisma; `mocks.ts` queda exclusivamente como fixture de pruebas de UI.

## Funcionalidad

- Catálogo exclusivo de la tienda de la sesión, con unidad, imagen o icono y estados **Urge surtir / Pendiente / Bien surtido**.
- Venta o surtido de una unidad con un toque; captura adicional de cantidades enteras de 1 a 10,000.
- Búsqueda por nombre/categoría, filtro de productos por surtir y orden de prioridad rojo → amarillo → verde.
- Aviso y contador de productos críticos. En cero se bloquean las salidas y se explica «No hay unidades para sacar».
- Detalle con los 20 movimientos más recientes y predicción basada en **todas** las salidas de los últimos siete días.
- Consulta y presentación de una vaquita abierta del mismo producto cuando el inventario es crítico, con faltantes, ahorro por unidad y enlace a su detalle.
- Si no hay una compra abierta, abre el formulario real para armar una vaquita con ese producto precargado.
- Búsqueda por código escrito o cámara, restringida a la tienda actual. La lectura abre el detalle: vender o surtir exige una acción explícita posterior.
- Cámara bajo control de la app: permiso tras pulsar el botón, streams detenidos al cancelar/navegar, callbacks vencidos descartados y captura manual como alternativa.

## Integridad y acceso

`registrarMovimiento` obtiene la tienda de `assertTiendaAprobada()` y valida la entrada con Zod. La actualización condicional y la creación del movimiento comparten una transacción. Las salidas comprueban existencias en la escritura: dos solicitudes simultáneas no pueden tomar la misma última unidad.

El detalle utiliza una transacción `RepeatableRead` para que existencias, historial y suma de salidas correspondan a la misma instantánea. Las lecturas se filtran por tienda; el cliente nunca decide quién actúa.

Una venta rechazada refresca los datos. Si se pierde una confirmación, se bloquean nuevos envíos hasta actualizar la vista: no se supone que la operación falló ni se invita a repetirla sin consultar.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `actions.ts` | Validación, autorización y movimientos atómicos |
| `queries.ts` | Consultas reales, orden, historial y predicción |
| `logic.ts` | Reglas puras de nivel y días de existencias |
| `components/InventarioLista.tsx` | Catálogo, filtros y estados vacíos |
| `components/ControlesStock.tsx` | Acciones de una unidad y captura de cantidades |
| `components/useInventario.ts` | Confirmación de existencias, bloqueo de envíos y errores |
| `components/InventarioDetalle.tsx` | Composición de servidor y consumo de la API de vaquitas |
| `components/DetalleInventarioContenido.tsx` | Detalle, historial y opción de compra colectiva |
| `codigos.ts` | Búsqueda de código en el servidor, con autorización de tienda |
| `camara.ts` | Liberación de tracks y validación de sesión de captura |
| `components/LectorCodigo.tsx` | Cámara, decodificación local y captura manual |
| `oportunidad.ts` | Rechaza ofertas vencidas, completas o de otro producto |
| `components/inventario.module.css` | Estilos locales, paleta y controles táctiles |

La ruta `src/app/(app)/inventario/[id]/page.tsx` permanece delgada. El módulo no modifica la barra de navegación ni el estilo global de Sebastían.

## Verificación

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

La suite normal omite las siete pruebas de PostgreSQL. Para la entrega se ejecuta también la suite con base real. Para incluirlas, preparar **una base dedicada** llamada `la_vaquita_inventario_test`, aplicar el esquema y ejecutar:

```bash
INVENTARIO_TEST_DATABASE_URL='postgresql://USUARIO:CLAVE@HOST:PUERTO/la_vaquita_inventario_test' npm test
```

Se comprueba el nombre de la base antes de acceder. Las pruebas crean registros con identificadores propios y los eliminan al terminar, sin truncar tablas. Una prueba crea y elimina un trigger temporal para demostrar un rollback real. No ejecutar otros flujos sobre esa base durante la suite.

Comprobado en esta entrega: **88 pruebas aprobadas**, incluidas siete con PostgreSQL 16, typecheck, lint y build de producción. La prueba de navegador usa inicio de sesión real, PostgreSQL temporal, 360 y 1280 px, controles de al menos 44×44 px, texto de al menos 16 px, cantidades, filtros, historial, dos pestañas disputando la última unidad y respuesta perdida después del commit. También se comprobó hidratación con navegador en UTC y hora de Morelia. Los extras se validaron creando una vaquita real y decodificando EAN-13 desde una cámara virtual, incluyendo permiso pendiente al cancelar y permiso denegado con alternativa manual. No hubo streams activos tras cancelar ni movimientos automáticos por la lectura.

## Entorno local de esta máquina

Se generaron `.env` y `.env.compose.local` con permisos 0600, ambos ignorados por Git. Las claves y contraseñas no se incluyen en el PR. Se usa un volumen nuevo de La Vaquita, separado de otros proyectos.

- Aplicación: `http://localhost:3100` (el puerto 3000 corresponde a otro proyecto).
- PostgreSQL 16: `127.0.0.1:55432`.
- Buzón Mailpit: `http://localhost:8025`.

```bash
docker compose -p lavaquita_alvaro -f docker-compose.yml -f .env.compose.local up -d postgres mailpit
npm run dev -- -H 127.0.0.1 -p 3100
```

La migración inicial y el seed se aplicaron a esta base nueva. Las cuentas demo usan la contraseña `SEED_DEMO_PASSWORD` de `.env`; no pegarla en chats ni commits. Para probar la captura manual puede escribirse `DEMO-COCA`. Los códigos `DEMO-*` son internos y no corresponden a empaques reales; el catálogo puede asociar sus códigos reales mediante el campo existente `Producto.codigoBarras`.

`html5-qrcode` se carga al solicitar cámara y solo decodifica las imágenes locales. `getUserMedia` administra el stream de captura. Las imágenes no se envían al servidor; solo se consulta el texto del código. En celulares la cámara requiere HTTPS; la entrada manual funciona como alternativa.

## Dependencias y coordinación

- **RF-INV-08/09:** integrados con el módulo real de Jesús desde develop. El enlace de creación utiliza `/vaquitas?productoId=...` y conserva el formulario y las reglas de su módulo.
- **RF-INV-10:** implementado con captura manual y cámara. La validación automatizada utiliza cámara virtual; queda pendiente comprobar hardware físico de Android/iOS.
- Se conserva el lockfile del equipo y se agrega `html5-qrcode` 2.3.8, previsto en docs/plan.md; no se cambia de framework.
- Compatibilidad necesaria: formato de plugins de PostCSS; se conservaron las correcciones de `Uint8Array` de Hiram; zona `America/Mexico_City` en `formatoFechaHora` para evitar diferencias de hidratación.
- `npm audit` del 19 de noviembre de 2026 reportó **11 vulnerabilidades: 2 críticas, 7 altas y 2 moderadas** en el árbol heredado. Incluye Vitest/tinypool, Nodemailer, Zod, sharp, PostCSS y dependencias de Prisma. Varias correcciones propuestas requieren versiones mayores; coordinar la actualización con el equipo, respetando el stack acordado. No se ejecutó `npm audit fix --force`.
