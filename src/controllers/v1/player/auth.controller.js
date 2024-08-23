const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const { uid } = require('uid');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res, next) => {
        const { telegram_id, username, first_name, last_name, referral_code } = req.body;

        try {
            // Start a transaction
            const player = await prisma.$transaction(async (prisma) => {
                // Check if the user exists
                let player = await prisma.player.findFirst({ where: { telegram_id } });
                let referee = null;
                let isNewUser = !player;
                let currentTime = Math.floor(Date.now() / 1000);

                if (isNewUser) {
                    if (referral_code) {
                        referee = await prisma.player.findFirst({ where: { referral_code } });
                        if (!referee) {
                            throw {
                                status: 400,
                                message: "Referral code not found",
                            };
                        }
                    }

                    // Create new player
                    player = await prisma.player.create({
                        data: {
                            telegram_id,
                            username,
                            first_name,
                            last_name,
                            referral_code: uid(),
                            referee_id: referee ? referee.id : null,
                            created_at_unix: currentTime,
                            updated_at_unix: currentTime,
                        }
                    });

                    await prisma.levelHistory.create({
                        data: {
                            player_id: player.id,
                            level: 1,
                            data: JSON.stringify({
                                previous_level: 0,
                                new_level: 1,
                                note: 'Initial level',
                            }),
                            created_at_unix: currentTime,
                            updated_at_unix: currentTime,
                        }
                    });
                }

                // Default values
                const defaultValues = {
                    passive_per_hour: parseInt(process.env.DEFAULT_PROFIT_PER_HOUR, 10) || 0,
                    tap_max: parseInt(process.env.DEFAULT_TAP_MAX, 10) || 0,
                    tap_points: parseInt(process.env.DEFAULT_TAP_POINTS, 10) || 0,
                    tap_available: parseInt(process.env.DEFAULT_TAP_MAX, 10) || 0,
                    coins_total: parseInt(process.env.DEFAULT_COINS, 10) || 0
                };

                // Check if playerEarning exists, if not create it
                const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: player.id } });
                if (!playerEarning) {
                    await prisma.playerEarning.create({
                        data: {
                            player_id: player.id,
                            ...defaultValues,
                            coins_balance: defaultValues.coins_total,
                            created_at_unix: currentTime,
                            updated_at_unix: currentTime,
                        }
                    });

                    await prisma.pointHistory.create({
                        data: {
                            player_id: player.id,
                            amount: defaultValues.coins_total,
                            type: "INITIAL",
                            data: JSON.stringify({
                                nominal: defaultValues.coins_total,
                                previous_balance: 0,
                                previous_total: 0,
                                new_balance: defaultValues.coins_total,
                                new_total: defaultValues.coins_total,
                            }),
                            created_at_unix: currentTime,
                            updated_at_unix: currentTime,
                        }
                    });

                    await prisma.passiveEarningHistory.create({
                        data: {
                            player_id: player.id,
                            amount: defaultValues.coins_total,
                            type: "INITIAL",
                            data: JSON.stringify({
                                nominal: defaultValues.coins_total,
                                previous_value: 0,
                                new_value: defaultValues.coins_total,
                            }),
                            created_at_unix: currentTime,
                            updated_at_unix: currentTime,
                        }
                    });
                }

                // Handle referral bonuses
                if (isNewUser && referee) {
                    const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
                    const levelData = JSON.parse(levelConfig.value);
                    const referralCoins = levelData[0].level_up_reward;

                    await prisma.playerEarning.updateMany({
                        where: { player_id: { in: [player.id, referee.id] } },
                        data: {
                            coins_total: { increment: referralCoins },
                            coins_balance: { increment: referralCoins },
                        }
                    });

                    const refereeEarning = await prisma.playerEarning.findFirst({ where: { player_id: referee.id } });

                    await prisma.pointHistory.createMany({
                        data: [
                            {
                                player_id: player.id,
                                amount: referralCoins,
                                type: "REFERRAL",
                                data: JSON.stringify({
                                    nominal: referralCoins,
                                    previous_balance: playerEarning.coins_balance,
                                    previous_total: playerEarning.coins_total,
                                    new_balance: playerEarning.coins_balance + referralCoins,
                                    new_total: playerEarning.coins_total + referralCoins,
                                    referee_id: referee.id
                                }),
                                created_at_unix: currentTime,
                                updated_at_unix: currentTime
                            },
                            {
                                player_id: referee.id,
                                amount: referralCoins,
                                type: "REFERRAL",
                                data: JSON.stringify({
                                    nominal: referralCoins,
                                    previous_balance: refereeEarning.coins_balance,
                                    previous_total: refereeEarning.coins_total,
                                    new_balance: refereeEarning.coins_balance + referralCoins,
                                    new_total: refereeEarning.coins_total + referralCoins,
                                    referrer_id: player.id
                                }),
                                created_at_unix: currentTime,
                                updated_at_unix: currentTime
                            }
                        ]
                    });
                }

                return player;
            });

            // Generate JWT token
            const token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET);

            return res.status(200).json({
                status: true,
                message: "Player logged in",
                error: null,
                data: { token }
            });
        } catch (error) {
            // Check if error contains custom error object and use its status and message
            if (error.status && error.message) {
                return res.status(error.status).json({
                    status: false,
                    message: error.message,
                    error: null,
                    data: null
                });
            }

            // Fallback for unknown errors
            next(error);
        }
    },

    whoami: async (req, res, next) => {
        try {
            const user = { ...req.user };
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: req.user.id } });

            if (playerEarning) {
                user.point = playerEarning.coins_balance;
                user.profit_per_hour = playerEarning.passive_per_hour;
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
