const { PrismaClient } = require('@prisma/client');
declare global {
  var prisma: typeof PrismaClient | undefined;
}
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
export default prisma;
