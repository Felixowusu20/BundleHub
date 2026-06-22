import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Bump when schema changes so dev hot-reload picks up new models. */
const PRISMA_CLIENT_VERSION = 4;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion: number | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (
    !globalForPrisma.prisma ||
    globalForPrisma.prismaVersion !== PRISMA_CLIENT_VERSION
  ) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
