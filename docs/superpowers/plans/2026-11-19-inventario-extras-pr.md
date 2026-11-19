# Extras e integración de inventario — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completar RF-INV-09/10 con la API actual de develop, preparar el entorno local y publicar el PR autorizado hacia develop.
**Architecture:** Consumir acciones públicas de vaquitas desde el inventario; buscar códigos por tienda en el servidor; cargar el lector de cámara solo al solicitarlo. Mantener credenciales locales en .env ignorado y usar servicios propios.
**Tech Stack:** Stack existente y html5-qrcode, biblioteca prevista en docs/plan.md.
**Spec:** docs/SRS.md RF-INV-08/09/10; instrucciones actuales del usuario, incluido comentario literal y coautor @alanhiram75.

## Constraints y revisión

- Conservar el trabajo existente y sincronizar develop sin force-push.
- Aprobar tienda en el servidor y no revelar códigos de otras tiendas.
- Un código detectado abre el producto; el movimiento exige una acción explícita del tendero.
- Solicitar cámara solo tras pulsar Usar cámara; liberar su stream al cerrar o navegar y permitir captura manual.
- Mantener 360 px, texto ≥16 px y controles ≥44 px.
- No tocar servicios de Semáforo ni subir .env/credenciales.
- PR hacia develop, comentario literal «soy hiram alavro se fue a comer», coautoría verificable en el commit.

## Tareas

- [x] Actualizar referencias, conservar cambios con stash y sincronizar develop; resolver la conversión de bytes usando la versión del equipo.
- [x] Pruebas RED/GREEN para lookup de códigos y captura/creación desde alerta.
- [x] Implementar lector, alternativa manual y creación consumiendo crearVaquita del módulo público.
- [x] Crear .env privado, PostgreSQL 16 y Mailpit separados; aplicar migración y seed local.
- [x] Verificar suite, tipos, lint, build e interacción móvil, con revisión independiente de los extras.
- [ ] Commit con coautoría, push y PR contra develop; publicar comentario autorizado.

## Cambios de contexto

Al actualizar origin se encontró que Jesús ya integró su módulo a develop (8a3769e). Las dos diferencias de stash en seed/storage eran equivalentes; se conservó new Uint8Array del equipo. El puerto 3000 corresponde a Semáforo; La Vaquita usará 3100.

## Verificación de extras

Se reprodujeron y corrigieron cierres con permiso pendiente y callbacks tardíos. La cámara queda bajo getUserMedia y html5-qrcode solo decodifica imágenes, evitando el ciclo play/stop problemático de su renderer. Las pruebas reales en navegador verificaron lookup manual, creación con producto precargado, enlace a la compra creada, lectura EAN-13 desde cámara virtual, stream cerrado al cancelar antes del permiso y alternativa manual tras denegarlo. No hubo movimientos de inventario al leer ni errores de hidratación. La revisión independiente quedó atendida; se actualizó la documentación y el estado del lector al desmontarse.

Resultado final de verificación: 78 pruebas (7 PostgreSQL 16), typecheck, lint y build aprobados. Navegador con 11 comprobaciones de integración/lector aprobado, incluida cámara virtual EAN-13 y cancelación pendiente sin streams ni excepciones. Coautor verificado: Alanhiram75, GitHub ID 104286038.

La preparación del PR se actualizó además sobre develop 9a22b7f (auth/UI del equipo). La suite integrada pasa 88 pruebas, incluidas siete con PostgreSQL 16. Se conserva la coautoría en los dos commits.
