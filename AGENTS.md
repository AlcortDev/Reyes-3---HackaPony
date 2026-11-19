# AGENTS.md — Guía para agentes de IA y desarrolladores · La Vaquita

> Lee esto **antes** de escribir código. La fuente de verdad es [`docs/SRS.md`](docs/SRS.md) (requisitos, reglas, contratos) y [`docs/plan.md`](docs/plan.md) (roles, cronograma).

## Qué es
App web (mobile-first) para tienditas de colonia en Morelia: inventario rápido con alertas + **vaquitas** (compras en grupo para precio de mayoreo) + login seguro con **verificación de tiendas** por un admin. Hackathon de 8 h: prioriza MUST → SHOULD → COULD.

**Stack fijo:** Next.js 15 (App Router) · TypeScript estricto · Tailwind 4 · shadcn/ui · PostgreSQL 16 · Prisma 6 · Better Auth. No agregues frameworks nuevos.

## Comandos
```bash
npm install                 # instala y genera el cliente Prisma
npm run db:up               # Postgres + Mailpit en Docker
npm run db:migrate          # aplica el schema (la primera vez: nombre "init")
npm run db:seed             # datos demo (requiere .env completo)
npm run dev                 # http://localhost:3000
npm run dev:red             # igual, accesible desde celulares en la red local
npm run typecheck && npm run lint && npm test
```
Correos de desarrollo: **http://localhost:8025** (Mailpit). Cuentas demo: ver salida de `npm run db:seed`.

## Quién es dueño de qué
| Carpeta | Dueño | Notas |
| :--- | :--- | :--- |
| `src/shared/**`, `prisma/**`, `docker-compose.yml` | **Hiram** | Avisar antes de tocar. `schema.prisma` es contrato. |
| `src/modules/auth`, `tiendas`, `admin` | **Hiram** (`actions.ts`, `queries.ts`) + **Sebastían** (`components/`) | El contrato entre ambos es `schemas.ts` (Zod). |
| `src/modules/inventario` | **Alvaro** | |
| `src/modules/vaquitas`, `src/modules/ahorro` | **Jesús** | |
| `src/app/layout.tsx`, `globals.css`, `src/shared/components/Navbar.tsx`, `src/components/ui` | **Sebastían** | |

Tus tareas están marcadas en el código: `grep -rn "TODO(Alvaro)" src` (o tu nombre). Cada TODO cita su requisito del SRS.

## Reglas (no negociables)
1. **Solo edita tu módulo.** Fuera de él, avisa al equipo.
2. **Entre módulos solo se importa desde el `index.ts`**: `import { x } from "@/modules/vaquitas"`. Dentro de tu módulo usa rutas relativas (`../logic`). ESLint lo revisa.
3. **Páginas en `src/app/` delgadas:** solo llaman queries y renderizan componentes del módulo.
4. **Seguridad en el servidor** (RNF-SEC):
   - Toda server action / route handler de inventario, vaquitas y ahorro empieza con `assertTiendaAprobada()`; las de admin con `assertAdmin()`. Páginas y layouts usan `require*()` (redirigen).
   - La tienda **siempre sale de la sesión**. Nunca aceptes `tiendaId`/`userId` del cliente para decidir quién actúa.
   - Valida toda entrada con **Zod** en el servidor. Prohibido `$queryRawUnsafe` / `$executeRawUnsafe`.
   - Archivos: solo con `validarArchivo()` + `limpiarArchivo()`; documentos solo vía `src/shared/storage.ts`.
   - Nunca registres contraseñas, tokens ni contenido de documentos (ni en `console.log`).
   - Mensajes de error genéricos en login/registro/recuperación (no revelar si un correo existe).
5. **Server actions** devuelven `Resultado<T>` (`src/shared/types.ts`) con mensajes en español listos para el usuario; no lances errores al cliente.
6. **Reglas de negocio** (SRS §3.3) mandan sobre la UI. Lógica pura en `logic.ts` (con test en `logic.test.ts`).
7. **Componentes cliente** (`"use client"`) no importan `@/shared/security`, `@/shared/db`, `@/shared/storage` ni `queries.ts` (son de servidor). Sí pueden importar server actions.
8. **UX para el tendero:** botones ≥ 44 px, texto ≥ 16 px, color + ícono/texto, lenguaje coloquial (RNF-01…05). Mobile-first (360 px).
9. **Dinero en MXN** con `formatoMoneda()`; fechas con `formatoFechaHora()`.
10. Si cambias un contrato (firma en `index.ts`, `schema.prisma`), **actualiza `docs/SRS.md` en el mismo PR**.

## Git
- Trabaja en tu rama (`Alvaro`, `Hiram`, `Jesús`, `Sebastían`), haz `git pull origin develop` al menos cada hora.
- PR a `develop`; otra persona revisa 2 min. Solo Hiram mergea `develop → main`.
- Commits chicos citando el requisito: `feat(inventario): semáforo de stock [RF-INV-04]`.
- `.env` nunca se sube.

## Componentes shadcn
Se agregan con `npx shadcn@latest add <componente>` (van a `src/components/ui`). Para evitar choques, **solo Sebastían** los agrega y los sube; los demás los piden.
