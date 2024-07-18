const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const jwt = require('jsonwebtoken');
const { whoami } = require('../admin.controller');

module.exports = {
    login: async (req, res, next) => {
        try {
            let { telegram_id, username, first_name, last_name } = req.body;
            let player = await prisma.player.upsert({
                where: { telegram_id },
                update: { username, first_name, last_name },
                create: { telegram_id, username, first_name, last_name, created_at: Math.floor(Date.now() / 1000) }
            });

            let token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET, { expiresIn: '1d' });

            return res.status(200).json({
                status: true,
                message: "Player logged in",
                error: null,
                data: { token }
            });
        } catch (error) {
            next(error);
        }
    },

    whoami: async (req, res, next) => {
        try {
            return res.status(200).json({
                status: true,
                message: "Player details",
                error: null,
                data: req.user
            });
        } catch (error) {
            next(error);
        }
    }
};