FROM node:22-alpine

# Dependencias del sistema requeridas por Prisma ORM, Next.js y Better Auth en Alpine
RUN apk add --no-cache libc6-compat openssl bash

# Habilitar corepack (soporte para npm / pnpm / yarn)
RUN corepack enable

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Si ya existe package.json al momento del build, instalar dependencias y generar cliente Prisma
RUN if [ -f package.json ]; then npm install; fi
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Puerto 3000 (Next.js) y 5555 (Prisma Studio)
EXPOSE 3000 5555

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["sh", "-c", "if [ -f package.json ]; then npm install && ( [ -f prisma/schema.prisma ] && npx prisma generate || true ) && npm run dev -- -H 0.0.0.0; else echo 'Contenedor listo. Esperando inicialización del proyecto Next.js (package.json)...' && tail -f /dev/null; fi"]
