import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

const prismaClient =
  global.__prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prismaClient;

export { prismaClient };

export async function connectDatabase() {
  try {
    await prismaClient.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prismaClient.$disconnect();
  console.log("Database disconnected");
}
