# 🐄 Plan de Batalla — HackaPony 2026 · Equipo REYES

> **Proyecto:** *La Vaquita* — inventario rápido + compras en grupo para tienditas de colonia.
> **Tiempo:** 8 horas. **Meta:** demo en vivo estable, bonita y ensayada. Nada de "eso solo está en la diapositiva".
> 📘 **Requisitos, diagramas y contratos:** [`docs/SRS.md`](docs/SRS.md) — la fuente de verdad para personas y agentes.

---

## 👥 Roles

Cada quien es **dueño** de una parte: decide, la construye y la explica en la presentación. Si alguien se atora más de 20 min, **grita** y otro le echa la mano.

| Integrante | Rol | Es dueño de… | Rama |
| :--- | :--- | :--- | :--- |
| **Hiram** | 🏗️ **El Arquitecto** (Tech Lead / Backend) | Proyecto base, BD, Prisma, seed de datos, server actions, deploy | `Hiram` |
| **Alvaro** | 📦 **El Bodeguero** (Módulo Inventario) | Catálogo, stock, entradas/salidas, alertas, predicción "se acaba en X días" | `Alvaro` |
| **Jesús** | 🛒 **El de la Vaquita** (Módulo Pedido Grupal) | Canastas, aportaciones, barra de progreso en tiempo real, meta cumplida 🎉 | `Jesús` |
| **Sebastían** | 🎨 **El Marchante** (UX/UI + Pitch) | Layout, navegación, diseño, ahorro, WhatsApp/QR, diapositivas y guion | `Sebastían` |

> ¿No les gusta su rol? Lo cambian en el minuto 0, **no** en la hora 5.

---

## ⏱️ Cronograma (8 h)

```
0:00 ─ 0:30  🤝 KICKOFF (todos juntos)
0:30 ─ 2:00  🔨 BLOQUE 1  · Cimientos
2:00 ─ 2:10  ✅ CHECKPOINT 1
2:10 ─ 4:00  🔨 BLOQUE 2  · Flujo principal
4:00 ─ 4:30  ✅ CHECKPOINT 2 + 🍕 comida (merge a main + deploy)
4:30 ─ 6:00  🔨 BLOQUE 3  · Conexión + extras "wow"
6:00         🧊 FREEZE DE FEATURES (ya no se agrega nada nuevo)
6:00 ─ 7:00  🐛 BLOQUE 4  · Pulido, bugs, responsive
7:00         🧊 FREEZE DE CÓDIGO (merge final a main)
7:00 ─ 8:00  🎤 ENSAYO (3 veces con cronómetro) + video de respaldo
```

### 🤝 0:00 – 0:30 · Kickoff (todos)
- [ ] Confirmar roles y nombre **La Vaquita**.
- [ ] Acordar el **modelo de datos** (abajo) — es el contrato entre todos, nadie lo cambia sin avisar.
- [ ] Acordar los **contratos entre módulos** (ver *Arquitectura modular*) y que cada dueño cree su carpeta `src/modules/<módulo>/` con su `index.ts`.
- [ ] Decidir auth: **recomendado → selector "Entrar como…"** guardado en cookie. Better Auth solo si sobra tiempo.
- [ ] Hiram crea el proyecto y lo sube a `develop`; los demás hacen `git pull` y crean su rama de trabajo.
- [ ] Definir las 3 tiendas y ~10 productos del seed (ver *Datos simulados*).

---

### 🔨 Bloque 1 · Cimientos (0:30 – 2:00)

| Quién | Tareas |
| :--- | :--- |
| **Hiram** | `create-next-app` (TS + Tailwind) · `shadcn init` · Prisma + Postgres en la nube (Neon/Supabase) · `schema.prisma` · `prisma/seed.ts` con las 3 tiendas · deploy vacío a Vercel |
| **Alvaro** | Mientras sale la BD: UI de la tabla/tarjetas de inventario con datos mock · componentes de botones **+ / −** grandes · badge de semáforo 🟢🟡🔴 |
| **Jesús** | UI de la lista de vaquitas y del detalle con datos mock · componente `BarraVaquita` (progreso + meta + ahorro) · lista de aportaciones por tienda |
| **Sebastían** | Layout general: navbar inferior tipo app (Inventario · Vaquitas · Ahorro) · pantalla `/` "Entrar como…" · paleta de colores, logo de la vaquita, tipografía grande · esqueleto de diapositivas |

**✅ Checkpoint 1 (2:00):** proyecto corre en todas las laptops, BD con seed, se ve el layout con mocks.

---

### 🔨 Bloque 2 · Flujo principal (2:10 – 4:00)

| Quién | Tareas |
| :--- | :--- |
| **Hiram** | Server actions / API: `registrarMovimiento`, `crearCanasta`, `aportarACanasta` (valida que no pase de la meta y marca `COMPLETA`) · endpoint `GET /api/canastas/[id]` para el polling · ayudar a conectar a Alvaro y Jesús con datos reales |
| **Alvaro** | Conectar inventario a la BD · registrar entradas/salidas · alerta visual de bajo stock · historial de movimientos del producto |
| **Jesús** | Conectar vaquitas a la BD · botón "Entrarle a la vaquita" con cantidad · crear nueva vaquita · **polling cada 2 s** (SWR/React Query) para que la barra suba sola en otra pantalla |
| **Sebastían** | Pantalla **Ahorro**: menudeo vs mayoreo por tienda ("ahorraste $420") · responsive en celular · estados vacíos y de carga · avanzar diapositivas (problema + propuesta) |

**✅ Checkpoint 2 (4:00):** 🎯 **el MVP completo funciona**: stock con alertas + 2 tiendas llenan una vaquita en tiempo real. Merge `develop → main` y deploy. *A partir de aquí todo es bonus.*

---

### 🔨 Bloque 3 · Conexión + "wow" (4:30 – 6:00)

| Quién | Tareas |
| :--- | :--- |
| **Hiram** | Botón "Reiniciar demo" (vuelve a correr el seed) · revisar estabilidad y errores en Vercel · apoyar donde haga falta |
| **Alvaro** | 🔗 **Alerta → Vaquita**: si un producto está bajo y hay vaquita abierta de ese producto, mostrar "Faltan 12 cajas, te ahorras $3.50/pza · [Unirme]" · predicción "se te acaba en ~3 días" |
| **Jesús** | 🎉 Confeti + estado "¡Precio de mayoreo desbloqueado!" · cuenta regresiva de cierre · punto de entrega |
| **Sebastían** | 📲 Botón **Invitar por WhatsApp** (`wa.me/?text=`) · **QR** de la vaquita para que el jurado entre como "Tienda #4" · terminar diapositivas |

**Extras solo si sobra tiempo (en este orden):** escáner de código de barras (`html5-qrcode`) → mapa de la colonia (Leaflet) → dictado por voz.

---

### 🐛 Bloque 4 · Pulido (6:00 – 7:00)
- **Todos** prueban el flujo completo en celular y laptop, y anotan bugs en el chat del equipo.
- Cada dueño arregla los bugs de su módulo. **Cero features nuevas.**
- Sebastían revisa textos, ortografía y que todo se entienda sin explicar.
- Hiram hace el merge final a `main` a las **7:00** y verifica el deploy.

### 🎤 Ensayo (7:00 – 8:00)
- 3 ensayos completos con cronómetro (5 + 5 min). Si se pasan, se recorta texto, no demo.
- Grabar un **video de respaldo** de la demo por si falla el internet.
- Preparar respuestas para el jurado (ver abajo).

---

## 🗄️ Modelo de datos (contrato)

```prisma
model Tienda {
  id          String       @id @default(cuid())
  nombre      String       // "Abarrotes Doña Lupe"
  encargado   String
  direccion   String
  lat         Float?
  lng         Float?
  inventario  Inventario[]
  aportaciones Aportacion[]
}

model Producto {            // catálogo global (mismo producto en todas las tiendas)
  id            String       @id @default(cuid())
  nombre        String       // "Coca-Cola 600 ml"
  categoria     String
  unidad        String       // "pieza", "caja de 24"
  precioMenudeo Float
  codigoBarras  String?
  imagen        String?
  inventarios   Inventario[]
  canastas      Canasta[]
}

model Inventario {          // stock de un producto en una tienda
  id          String       @id @default(cuid())
  tiendaId    String
  productoId  String
  stock       Int
  stockMinimo Int
  tienda      Tienda       @relation(fields: [tiendaId], references: [id])
  producto    Producto     @relation(fields: [productoId], references: [id])
  movimientos Movimiento[]
  @@unique([tiendaId, productoId])
}

model Movimiento {
  id           String       @id @default(cuid())
  inventarioId String
  tipo         TipoMov      // ENTRADA | SALIDA
  cantidad     Int
  fecha        DateTime     @default(now())
  inventario   Inventario   @relation(fields: [inventarioId], references: [id])
}

model Canasta {             // la "vaquita"
  id            String        @id @default(cuid())
  productoId    String
  proveedor     String        // "Central de Abastos Morelia"
  metaUnidades  Int
  precioMayoreo Float
  cierraEn      DateTime
  estado        EstadoCanasta @default(ABIERTA)
  producto      Producto      @relation(fields: [productoId], references: [id])
  aportaciones  Aportacion[]
}

model Aportacion {
  id        String   @id @default(cuid())
  canastaId String
  tiendaId  String
  cantidad  Int
  fecha     DateTime @default(now())
  canasta   Canasta  @relation(fields: [canastaId], references: [id])
  tienda    Tienda   @relation(fields: [tiendaId], references: [id])
}

enum TipoMov       { ENTRADA SALIDA }
enum EstadoCanasta { ABIERTA COMPLETA CERRADA }
```

## 🧭 Rutas

| Ruta | Qué muestra | Dueño |
| :--- | :--- | :--- |
| `/` | "Entrar como…" (elegir tienda) | Sebastían |
| `/inventario` | Productos de mi tienda, semáforo, + / − | Alvaro |
| `/inventario/[id]` | Detalle, historial, predicción, vaquita sugerida | Alvaro |
| `/vaquitas` | Vaquitas abiertas de la colonia | Jesús |
| `/vaquitas/[id]` | Barra en tiempo real, aportaciones, unirme, QR/WhatsApp | Jesús + Sebastían |
| `/ahorro` | Cuánto ahorró mi tienda y la colonia | Sebastían |

## 🧩 Arquitectura modular

El código se organiza **por módulo (feature)**, no por tipo de archivo. Cada módulo tiene un dueño, vive en su propia carpeta y solo expone lo necesario desde su `index.ts`. Así cada quien trabaja en su carpeta sin pisarse y los merges casi no chocan.

```
src/
├── app/                          # SOLO rutas: páginas delgadas que importan módulos
│   ├── layout.tsx                # (Sebastían)
│   ├── page.tsx                  # → modules/tiendas
│   ├── inventario/page.tsx       # → modules/inventario
│   ├── inventario/[id]/page.tsx
│   ├── vaquitas/page.tsx         # → modules/vaquitas
│   ├── vaquitas/[id]/page.tsx
│   ├── ahorro/page.tsx           # → modules/ahorro
│   └── api/canastas/[id]/route.ts
│
├── modules/
│   ├── tiendas/                  # 🎨 Sebastían — selector "Entrar como…", tienda actual
│   ├── inventario/               # 📦 Alvaro
│   ├── vaquitas/                 # 🛒 Jesús
│   └── ahorro/                   # 🎨 Sebastían
│
├── shared/                       # 🏗️ Hiram (avisar antes de tocar)
│   ├── db.ts                     # cliente Prisma único
│   ├── types.ts                  # tipos compartidos
│   ├── utils.ts                  # formatoMoneda, fechas, etc.
│   └── components/               # Navbar, Header, Semaforo, Confeti…
│
└── components/ui/                # shadcn (generado, no editar a mano)

prisma/
├── schema.prisma                 # 🏗️ Hiram
└── seed.ts                       # 🏗️ Hiram
```

### Estructura interna de cada módulo

```
modules/inventario/
├── components/        # UI del módulo (TarjetaProducto, BotonesStock, AlertaBajoStock…)
├── actions.ts         # server actions: registrarMovimiento()
├── queries.ts         # lecturas a BD: getInventarioPorTienda()
├── logic.ts           # funciones puras: esBajoStock(), diasParaAgotarse()
├── types.ts           # tipos propios del módulo
└── index.ts           # 🚪 API pública: lo único que otros módulos pueden importar
```

### Reglas del juego modular

1. **Cada quien solo edita su carpeta de módulo.** Fuera de ella, avisa en el chat.
2. **Entre módulos solo se importa desde `index.ts`.** ✅ `import { getVaquitaAbierta } from "@/modules/vaquitas"` · ❌ `import ... from "@/modules/vaquitas/queries"`.
3. **Las páginas en `app/` son delgadas:** importan el componente del módulo y ya, sin lógica.
4. **Lógica pura en `logic.ts`** (sin BD ni React): se explica fácil en la demo técnica y se puede probar sola.
5. **`shared/` es de Hiram.** Si alguien necesita algo ahí, lo pide o lo propone en un PR chiquito.
6. **Los contratos entre módulos se acuerdan en el kickoff** y no se cambian sin avisar:

| Módulo que expone | Función | La usa |
| :--- | :--- | :--- |
| `tiendas` | `getTiendaActual()` | todos |
| `vaquitas` | `getVaquitaAbiertaPorProducto(productoId)` | inventario (alerta → vaquita) |
| `vaquitas` | `getAportacionesPorTienda(tiendaId)` | ahorro |
| `inventario` | `getProductosBajoStock(tiendaId)` | vaquitas (sugerir vaquitas) |
| `ahorro` | `calcularAhorro(menudeo, mayoreo, cantidad)` | vaquitas (barra con ahorro) |

> 💡 Para no bloquearse: el dueño del módulo publica **primero la firma** de la función en su `index.ts` con datos falsos (`return mock`) y luego la conecta a la BD. Así el que la consume puede avanzar desde el minuto uno.

---

## 🏪 Datos simulados (seed)

- **Colonia:** una colonia real de Morelia (ej. Colonia Chapultepec Norte).
- **Tiendas:** 🏪 Abarrotes Doña Lupe · 🏪 Miscelánea El Güero · 🏪 Tienda La Esperanza.
- **~10 productos:** Coca-Cola 600 ml, Sabritas, Bimbo, huevo, aceite, frijol, arroz, Maseca, leche, papel higiénico.
- **Dejar a propósito:** 2–3 productos en rojo 🔴, una vaquita al **70 %** (para completarla en vivo) y otra ya **COMPLETA** (para mostrar el ahorro).

---

## 🌿 Git sin dramas

```
Sebastían ─┐
Alvaro    ─┼──► develop ──(checkpoints 4:00 y 7:00)──► main ──► Vercel (demo)
Jesús     ─┤
Hiram     ─┘
```

1. Cada quien trabaja en **su rama** y hace `git pull origin develop` seguido (mínimo cada hora).
2. Merge a `develop` con PR; **otra persona** le da un vistazo rápido (2 min, no auditoría).
3. **Solo Hiram** mergea `develop → main`.
4. Commits chiquitos y frecuentes. Nada de "commit gigante a las 6:55".
5. Archivos compartidos (`schema.prisma`, `layout.tsx`, `globals.css`): **avisar en el chat antes de tocarlos.**
6. `.env` **nunca** se sube. Hiram comparte las variables por el chat privado.

---

## 🎤 Presentación

### Exposición — 5 min (no técnica)
| Tiempo | Quién | Qué |
| :--- | :--- | :--- |
| 0:00 – 1:00 | **Sebastían** | El problema: Doña Lupe compra al menudeo y pierde contra el OXXO. Nombre: *La Vaquita*. |
| 1:00 – 3:30 | **Alvaro + Jesús** | 🔴 **Demo en vivo:** vende Cocas → alerta → "únete a la vaquita" → en el otro celular la barra sube → el jurado escanea el QR y la completa → 🎉 |
| 3:30 – 4:30 | **Sebastían** | Ahorro, costos (≈ $0 con planes gratis), modelo de negocio (comisión al distribuidor). |
| 4:30 – 5:00 | **Hiram** | Cierre y viabilidad. |

### Demostración técnica — 5 min
| Quién | Qué |
| :--- | :--- |
| **Hiram** (2 min) | Arquitectura: Next.js + Prisma + Postgres, modelo de datos, deploy |
| **Alvaro** (1 min) | Lógica de stock, alertas y predicción |
| **Jesús** (1 min) | Aportaciones, validación de meta y tiempo real |
| **Sebastían** (1 min) | Decisiones de UX para el usuario objetivo (botones grandes, semáforo, celular) |

### Preguntas probables del jurado (prepárenlas)
- ¿Qué pasa si la vaquita no se llena antes de que cierre?
- ¿Quién recoge y paga el pedido? ¿Cómo se reparte?
- ¿Cómo convencen a una tendera que no usa apps?
- ¿Cómo ganan dinero / es sostenible?
- ¿Cómo escala a otras colonias?
- ¿Por qué ese stack?

---

## 🧯 Plan B

| Si pasa… | Hacemos… |
| :--- | :--- |
| Se cae el internet | Video de respaldo + `npm run dev` local con hotspot del celular |
| Se rompe algo en vivo | Botón "Reiniciar demo" y seguimos |
| Better Auth da guerra | Se queda el selector "Entrar como…" |
| Una feature no queda a las 6:00 | Se esconde. No se presenta nada a medias |
| Alguien se atora +20 min | Lo dice y se reasigna o se recorta |

---

## 🎶 Reglas de convivencia

- ☕ Pausa de **5 min cada hora** — estírense, tomen agua, nada de pantallas.
- 🍕 La comida es a las **4:00**, junto con el checkpoint.
- 🎧 Playlist compartida; el que rompa `main` elige la siguiente canción (para mal).
- 🙌 Cada checkpoint cumplido = festejo chiquito. Nos estamos divirtiendo, ¿eh?
- 🚫 Prohibido decir "ya casi" más de dos veces sobre la misma tarea.
