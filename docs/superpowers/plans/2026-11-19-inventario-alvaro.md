# Módulo de inventario de Alvaro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Completar los requisitos MUST y SHOULD RF-INV-01…08 del inventario, con datos reales, control de acceso, movimientos atómicos y una interfaz móvil clara.

**Architecture:** Mantener los contratos existentes del módulo y las páginas delgadas. Prisma resuelve lecturas y transacciones; componentes cliente propios del inventario presentan controles accesibles y confirmaciones del servidor. Consumir vaquitas únicamente desde su API pública, sin implementar tareas de Jesús.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind 4, Prisma 6, PostgreSQL, Zod, Vitest y lucide-react existentes.

**Spec:** `docs/SRS.md` §§3.1 (inventario), 3.2, 3.3 y 6.3; `docs/plan.md` (tareas de Alvaro); preferencias visuales expresadas en esta conversación.

## Global Constraints

- Trabajar en la rama `Alvaro`; no cambiar esquema Prisma, autenticación, módulos ajenos ni estilos globales.
- La tienda que actúa sale de `assertTiendaAprobada()`; las páginas usan `requireTiendaAprobada()`.
- Toda entrada se valida con Zod; las acciones devuelven `Resultado<T>` con mensajes en español.
- No permitir existencias negativas, ni registrar movimientos sin actualizar existencias en la misma transacción.
- RNF-02: botones ≥44×44 px, texto base ≥16 px y cantidades ≥24 px; RNF-05: ancho mínimo 360 px.
- Estado mediante color e icono/texto, lenguaje cotidiano y estilo cercano al minimalismo con la paleta del usuario.
- No añadir componentes shadcn compartidos: los mantiene Sebastían. Reutilizar dependencias existentes.

## Review Focus

- Dos salidas concurrentes no deben vender más unidades de las disponibles.
- Un identificador de otra tienda nunca debe revelar datos ni permitir movimientos.
- Error al crear el movimiento debe revertir el cambio de existencias.
- La predicción usa todas las salidas de siete días, independientemente del límite del historial mostrado.
- Fallos de red y respuestas fuera de orden no deben presentar existencias inventadas ni duplicar movimientos.

### Task 1: Datos y movimientos seguros [RF-INV-01…05]

**Files:** `src/modules/inventario/{actions,queries,logic}.ts` y pruebas correspondientes.
**Interfaces:** Conservar `registrarMovimiento(input)`, `getInventarioPorTienda(tiendaId)` y `getProductosBajoStock(tiendaId)`.

- [x] Instalar dependencias y ejecutar pruebas de base.
- [x] Escribir y observar fallar pruebas de lecturas filtradas, prioridades, validaciones, autorización y transacciones.
- [x] Reemplazar mocks por Prisma; implementar actualización atómica con historial y revalidación.
- [x] Verificar pruebas del módulo y suite completa.

### Task 2: Detalle y enlace con compras colectivas [RF-INV-06…08]

**Files:** `src/modules/inventario/{queries,types,index}.ts`, `components/InventarioDetalle.tsx`, ruta `src/app/(app)/inventario/[id]/page.tsx`.
**Interfaces:** Mantener `getDetalleInventario(inventarioId, tiendaId)`; consumir `getVaquitaAbiertaPorProducto(productoId)` desde `@/modules/vaquitas`.

- [x] Probar historial, aislamiento por tienda, periodo de siete días y ausencia de movimientos.
- [x] Implementar consulta de detalle y predicción; rechazar vaquitas vencidas o completas al presentar el enlace.
- [x] Crear detalle, historial y enlace real a la vaquita; actualizar documentación de exports públicos si corresponde.
- [x] Verificar pruebas y tipos.

### Task 3: Interfaz móvil del inventario [RF-INV-01…05, RNF-01…06]

**Files:** `src/modules/inventario/components/*`, estilos locales y pruebas de interacción.
**Interfaces:** Lista y tarjeta comparten controles de movimientos; actualización confirmada por `registrarMovimiento` y revalidación del detalle.

- [x] Cubrir entradas/salidas, captura de cantidades, validación de cantidad y prevención de envíos duplicados.
- [x] Implementar tarjetas, búsqueda/filtro, semáforo, estados vacíos, mensajes y controles +/− sin alterar el layout compartido.
- [x] Comprobar interacción y ancho de 360 px en navegador, además de teclado y tamaños táctiles.

### Task 4: Verificación y entrega

- [x] Ejecutar typecheck, lint, suite y build; distinguir fallos del módulo de bloqueos preexistentes.
- [x] Probar movimientos contra una base desechable aislada si el entorno permite PostgreSQL.
- [x] Solicitar revisión independiente del código del módulo y resolver defectos importantes.
- [x] Registrar comprobaciones, dependencias pendientes de otros módulos y estado de los extras COULD RF-INV-09/10 sin presentarlos como terminados.

## Decisiones de ejecución

- Se ejecuta directamente la especificación existente por la instrucción del usuario de instalar y ponerse a trabajar; no se abre una nueva fase de aprobación de diseño.
- Se mantiene el checkout limpio de la rama personal `Alvaro`, siguiendo AGENTS.md, para que el trabajo quede disponible en el directorio compartido.
- Los extras COULD se evalúan después de completar y verificar MUST y SHOULD. No se crearán enlaces a formularios inexistentes.


## Resultado verificado

- Task 1: completo. Lecturas reales por tienda y transacciones condicionales; 20 pruebas iniciales RED → GREEN.
- Task 2: completo del lado de inventario. Historial, predicción consistente y consumidor de la API pública de vaquitas; integración real pendiente del proveedor de Jesús.
- Task 3: completo. Interacción real en navegador a 360 y 1280 px, cantidades, filtros y estados; controles ≥44 px y texto ≥16 px.
- Task 4: revisión independiente recibida y sus seis hallazgos importantes corregidos; sin menores diferidos.
- Verificación final: `INVENTARIO_TEST_DATABASE_URL=... npm test` → 56/56; `npm run typecheck` y `npm run lint` → 0 errores; `npm run build` → exit 0; `git diff --check` → exit 0.
- Navegador: inicio de sesión real, movimientos reales, dos pestañas sobre la última unidad, pérdida de respuesta HTTP después del commit sin duplicar movimiento y ausencia de errores de hidratación con UTC.
- Correcciones de revisión: refrescar rechazos y descartar respuestas de instantáneas reemplazadas; bloquear reintentos de confirmaciones inciertas; detalle con RepeatableRead; explicación al llegar a cero; oferta solo en crítico; formato estable de hora de Morelia. Las regresiones añadidas se observaron fallar antes de corregirlas.
- Decisiones: conservar rama personal Alvaro; limitar funcionalidad a MUST/SHOULD propios; mantener contratos públicos de Jesús sin implementar su módulo; dejar COULD-09/10 y la actualización mayor de dependencias para coordinación del equipo. Consecuencia: la unión real a vaquitas sigue pendiente y los extras no están disponibles.
- Auditoría: 11 vulnerabilidades del árbol heredado, registradas en `src/modules/inventario/README.md`; no se cambiaron versiones mayores del stack.


## Actualización posterior

La continuación autorizada sincronizó develop (8a3769e), completó RF-INV-09/10 e integró RF-INV-08 con las acciones reales de Jesús. Los pendientes de integración y extras descritos arriba corresponden al estado anterior; el resultado actual está en README del módulo y el plan inventario-extras-pr.
