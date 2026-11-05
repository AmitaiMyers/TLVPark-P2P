import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl === "") {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return databaseUrl;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: requireDatabaseUrl() });
  return new PrismaClient({ adapter });
}

// Each PrismaClient owns a connection pool. In development, Next.js re-evaluates
// modules on every hot reload, so the client is parked on globalThis to keep a
// single pool instead of leaking a new one per reload.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
