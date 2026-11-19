import { PrismaClient } from "@prisma/client";

// Un solo cliente Prisma (evita abrir conexiones de más con el recargado en caliente).
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
