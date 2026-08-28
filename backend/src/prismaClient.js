const { PrismaClient } = require("@prisma/client");

// A single shared Prisma client instance (recommended by Prisma docs -
// creating a new PrismaClient per request would exhaust DB connections).
const prisma = new PrismaClient();

module.exports = prisma;
