const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const uid = require('uid');
const jwt = require('jsonwebtoken');
const { parse } = require('path');

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
    },

    home: async (req, res, next) => {
        try {
            const response = {
                balance: 0,
                passive_earnings: {
                    per_hour: 0
                },
                tap_earnings: {
                    per_tap: 0,
                },
                level: {
                    current_level: 0,
                    current_level_score: 0,
                    next_level: 0,
                    next_level_score: 0,
                    next_level_percentage: 0
                }
            };

            // Fetch player's current balance and passive earnings from the database
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: req.user.id } });
            if (playerEarning) {
                response.balance = playerEarning.coins_balance;
                response.passive_earnings.per_hour = playerEarning.passive_per_hour;
                response.level.current_level_score = playerEarning.coins_total - playerEarning.coins_balance;
                response.tap_earnings.per_tap = playerEarning.tap_points;
            }

            // Fetch level configuration from the database
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (levelConfig) {
                const levels = JSON.parse(levelConfig.value);

                // Determine the player's current level
                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= response.level.current_level_score ? level : acc;
                }, levels[0]);

                // Determine the next level if it exists
                const nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                response.level.current_level = currentLevel.level;
                if (nextLevel) {
                    response.level.next_level = nextLevel.level;
                    response.level.next_level_score = nextLevel.minimum_score;
                    response.level.next_level_percentage = Math.floor((response.level.current_level_score / nextLevel.minimum_score) * 100);
                } else {
                    response.level.next_level = null;
                    response.level.next_level_score = null;
                    response.level.next_level_percentage = null;
                }
            }

            return res.status(200).json({
                status: true,
                message: "Player details retrieved successfully",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    }
};