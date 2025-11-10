// src/data/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Reuse a single client in dev (hot reload) and new one in prod
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['query', 'warn', 'error'], // optional: remove or tweak
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
