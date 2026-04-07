import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required to initialize Prisma.");
    }

    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }

  return globalForPrisma.prisma;
}
