const { PrismaClient } = require('@prisma/client');
const { PRISMA_LOG = 'true', ENV } = process.env;
const log = ENV !== 'production' && PRISMA_LOG === 'true' ? ['query'] : [];
const prisma = new PrismaClient({ log });

module.exports = prisma;
