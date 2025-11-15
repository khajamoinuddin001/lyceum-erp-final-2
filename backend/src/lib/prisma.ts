
// FIX: Replaced import with require to work around potential module resolution or type generation issues.
const { PrismaClient } = require('@prisma/client');


// This prevents multiple instances of Prisma Client in development
declare global {
  var prisma: typeof PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
