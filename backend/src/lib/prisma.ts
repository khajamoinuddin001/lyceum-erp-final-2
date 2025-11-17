// NOTE: If you see an error on the next line, it's likely because 'npx prisma generate' has not been run.
// Fix: Use a named import for PrismaClient.
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  // Fix: Use the correct type for the global prisma instance.
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;