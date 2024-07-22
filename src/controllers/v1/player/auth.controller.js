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

            let defaultAmount = process.env.DEFAULT_POINT_AMOUNT || 0;
            let deafaultProfitPerHour = process.env.DEFAULT_PROFIT_PER_HOUT || 0;
            let point = await prisma.point.findFirst({ where: { player_id: player.id } });
            if (!point) {
                await prisma.point.create({
                    data: {
                        player_id: player.id,
                        amount: parseInt(defaultAmount),
                        profit_per_hour: parseInt(deafaultProfitPerHour)
                    }
                });
            }

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