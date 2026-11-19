# Reyes 3 — Resiliencia Barrial: Compras Colectivas e Inventario Rápido

> Plataforma web para tienditas de abarrotes y comercios de colonia en México que optimiza el control de inventario y habilita canastas de compra colectiva para alcanzar precios de mayoreo frente a grandes cadenas.  
> **HackaPony 2026** | **Reto 01:** Comercio Local y PyMEs | **Equipo:** REYES (Reyes 3) — *Instituto Tecnológico de Morelia*.

---

## 🚀 Quick Path (Inicio Rápido)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno (.env con conexión a PostgreSQL)
cp .env.example .env

# 3. Preparar base de datos y datos de prueba
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar servidor de desarrollo
npm run dev
# Abrir http://localhost:3000 en el navegador
```

---

## 🎯 Módulos del MVP

| Módulo | Funcionalidad | Impacto / Validación |
| :--- | :--- | :--- |
| **Catálogo e Inventario Rápido** | Control ágil de entradas y salidas de stock con alerta visual de producto bajo/agotado. | Reduce quiebres de inventario sin requerir captura manual compleja. |
| **Canasta de Compra Colectiva** | Pedidos grupales donde 2 o más tiendas suman unidades hasta completar la meta de mayoreo. | Permite a comerciantes locales acceder a márgenes y precios de volumen. |
| **Simulación Barrial (Demo)** | Datos precargados de al menos 3 tiendas simuladas de una misma colonia. | Demostración funcional en vivo del flujo colaborativo entre comercios. |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Rol en el Proyecto |
| :--- | :--- | :--- |
| **Framework Fullstack** | Next.js (App Router, React) | Arquitectura unificada, Server Actions y endpoints API eficientes. |
| **Lenguaje** | TypeScript | Tipado estricto de punta a punta (contratos de datos, componentes y DB). |
| **UI & Estilos** | Tailwind CSS + shadcn/ui | Sistema de diseño ágil, accesible y adaptado para dispositivos móviles/desktop. |
| **Base de Datos** | PostgreSQL | Almacenamiento relacional para tiendas, inventarios y compras grupales. |
| **ORM** | Prisma | Esquema declarativo, migraciones automáticas y consultas type-safe. |
| **Autenticación** | Better Auth | Gestión de sesiones e identidad para los comerciantes. |

---

## 📋 Checklist de Evaluación (Rúbrica HackaPony 2026)

- [ ] **Prototipo Funcional (45 pts):** Ejecución estable, flujo principal activo y manejo consistente de datos de inventario y pedidos.
- [ ] **Impacto y Pertinencia (25 pts):** Solución aterrizada a la realidad económica del comercio minorista en México.
- [ ] **Experiencia de Usuario UX/UI (15 pts):** Navegación intuitiva, comprensión inmediata y carga visual ligera.
- [ ] **Pitch y Demostración en Vivo (15 pts):** Exposición clara (5 min general, 5 min técnica, 5 min preguntas del jurado).

---

## 👥 Datos del Reto
* **Institución:** Instituto Tecnológico de Morelia (H. Concejo Estudiantil)
* **Categoría:** Reto 01 — Comercio Local y PyMEs
* **Modalidad:** Hackathon 8 horas de desarrollo continuo + demo en vivo
