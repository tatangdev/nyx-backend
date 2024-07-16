const { PrismaClient } = require('@prisma/client');
const { create } = require('./user.controller');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    create: async (req, res, next) => {
        
    }
};