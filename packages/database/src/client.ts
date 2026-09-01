import { PrismaClient } from "../generated/client";

/**
 * Instância única do Prisma.
 *
 * Em desenvolvimento o hot reload recria os módulos a cada alteração; sem o
 * cache no globalThis, cada recarga abriria um novo pool de conexões até
 * esgotar o limite do Postgres.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
