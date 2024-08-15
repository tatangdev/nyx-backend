const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const { uid } = require('uid');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res, next) => {
        try {
            let { telegram_id, username, first_name, last_name, referral_code } = req.body;

            // check if user exists
            let player = await prisma.player.findFirst({ where: { telegram_id } });
            if (!player) {
                let refereeId;
                if (referral_code) {
                    let referee = await prisma.player.findFirst({ where: { referral_code } });
                    if (referee) {
                        refereeId = referee.id;
                    } else {
                        return res.status(400).json({
                            status: false,
                            message: "Referral code not found",
                            error: null,
                            data: null
                        });
                    }
                }

                player = await prisma.player.create({
                    data: {
                        telegram_id,
                        username,
                        first_name,
                        last_name,
                        created_at: Math.floor(Date.now() / 1000),
                        referral_code: uid(),
                        referee_id: refereeId
                    }
                });
            }

            let defaultPassivePerHour = parseInt(process.env.DEFAULT_PROFIT_PER_HOUR) || 0;
            let defaultTapMax = parseInt(process.env.DEFAULT_TAP_MAX) || 0;
            let defaultTapPoints = parseInt(process.env.DEFAULT_TAP_POINTS) || 0;
            let defaultTapAvailable = parseInt(process.env.DEFAULT_TAP_MAX) || 0;
            let defaultCoins = parseInt(process.env.DEFAULT_COINS) || 0;

            let now = Math.floor(Date.now() / 1000);
            let playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: player.id } });
            if (!playerEarning) {
                await prisma.playerEarning.create({
                    data: {
                        player_id: player.id,
                        passive_per_hour: defaultPassivePerHour,
                        tap_max: defaultTapMax,
                        tap_points: defaultTapPoints,
                        tap_available: defaultTapAvailable,
                        coins_total: defaultCoins,
                        coins_balance: defaultCoins,
                        last_updated: now
                    }
                });
            }

            let token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET);
            // let token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
            let user = { ...req.user };

            let point = await prisma.playerEarning.findFirst({ where: { player_id: req.user.id } });
            if (point) {
                user.point = point.coins_balance;
                user.profit_per_hour = point.passive_per_hour;
            }

            return res.status(200).json({
                status: true,
                message: "Player details",
                error: null,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
};