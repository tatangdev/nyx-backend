const prisma = require('../../../libs/prisma');
const yaml = require('js-yaml');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    sync: async (req, res, next) => {
        try {
            const playerId = req.user.id;

            // Fetch player's current earnings
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            const now = moment().tz(TIMEZONE);

            /* handle passive earnings */
            const MAX_PASSIVE_EARNINGS_DURATION = 180 * 60; // 180 minutes in seconds
            const elapsedTime = now.unix() - playerEarning.updated_at_unix;
            const passiveEarningsDuration = Math.min(elapsedTime, MAX_PASSIVE_EARNINGS_DURATION);
            const passiveEarningsPerSecond = playerEarning.passive_per_hour / 3600;
            const earnedPassiveCoins = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // update total and balance coins
            let totalCoins = playerEarning.coins_total + earnedPassiveCoins;
            let balanceCoins = playerEarning.coins_balance + earnedPassiveCoins;

            /* handle tap earnings */
            let availableTapAmount = Math.min(
                playerEarning.tap_earning_energy_available + elapsedTime * playerEarning.tap_earning_energy_recovery,
                playerEarning.tap_earning_energy
            );

            /* update player earning */
            if (earnedPassiveCoins != 0) {
                await prisma.playerEarning.update({
                    where: { id: playerEarning.id },
                    data: {
                        tap_earning_energy_available: availableTapAmount,
                        coins_total: totalCoins,
                        coins_balance: balanceCoins,
                        updated_at_unix: now.unix(),
                    }
                });
                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: earnedPassiveCoins,
                        type: "PASSIVE_EARNINGS",
                        data: yaml.dump({
                            nominal: earnedPassiveCoins,
                            previous_balance: playerEarning.coins_balance,
                            previous_total: playerEarning.coins_total,
                            new_balance: balanceCoins,
                            new_total: totalCoins,
                            note: "Passive earnings"
                        }),
                        created_at_unix: now.unix(),
                    }
                });
            }

            // Fetch and determine player level
            let levelData = {
                current_level: null,
                current_level_name: null,
                current_level_image_url: null,
                current_level_score: null,
                next_level: null,
                next_level_name: null,
                next_level_image_url: null,
                next_level_score: null,
                next_level_percentage: null
            };
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });

            if (levelConfig) {
                const levels = yaml.load(levelConfig.value);
                const currentLevelScore = totalCoins - balanceCoins;

                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= currentLevelScore ? level : acc;
                }, levels[0]);

                const nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                levelData.current_level = currentLevel.level;
                levelData.current_level_name = currentLevel.name;
                levelData.current_level_image_url = currentLevel.image_url;
                levelData.current_level_score = currentLevelScore;
                if (nextLevel) {
                    levelData.next_level = nextLevel.level;
                    levelData.next_level_name = nextLevel.name;
                    levelData.next_level_image_url = nextLevel.image_url;
                    levelData.next_level_score = nextLevel.minimum_score;
                    levelData.next_level_percentage = Math.floor(((currentLevelScore - currentLevel.minimum_score) / (nextLevel.minimum_score - currentLevel.minimum_score)) * 100);
                }
            }

            // Construct response
            const response = {
                passive_earnings: {
                    per_hour: playerEarning.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: earnedPassiveCoins,
                },
                tap_earnings: {
                    per_tap: playerEarning.tap_earning_value,
                    max_taps: playerEarning.tap_earning_energy,
                    available_taps: availableTapAmount,
                    recovery_per_second: playerEarning.tap_earning_energy_recovery,
                },
                level: levelData,
                total_coins: totalCoins,
                balance: balanceCoins,
                coupons_balance: playerEarning.coupons_balance/100,
                last_sync: now.unix(),
            };

            return res.status(200).json({
                status: true,
                message: "Player earnings updated successfully",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    },

    tapUpdate: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const { tap_count: tapCount, timestamp } = req.body;

            // Fetch player's current earnings
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            const now = moment().tz(TIMEZONE);
            let currentTimeInSeconds = now.unix();

            // Validate tap data and timestamp
            if (tapCount > 0) {
                const isInvalidTimestamp = timestamp <= 0 || timestamp <= playerEarning.updated_at_unix || timestamp > currentTimeInSeconds;
                if (isInvalidTimestamp) {
                    return res.status(400).json({
                        status: false,
                        message: "Invalid timestamp",
                        error: null,
                        data: null
                    });
                }
                currentTimeInSeconds = timestamp;
            }

            /* handle passive earnings */
            const MAX_PASSIVE_EARNINGS_DURATION = 180 * 60; // 180 minutes in seconds
            const elapsedTime = currentTimeInSeconds - playerEarning.updated_at_unix;
            const passiveEarningsDuration = Math.min(elapsedTime, MAX_PASSIVE_EARNINGS_DURATION);
            const passiveEarningsPerSecond = playerEarning.passive_per_hour / 3600;
            const earnedPassiveCoins = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // update total and balance coins
            let totalCoins = playerEarning.coins_total + earnedPassiveCoins;
            let balanceCoins = playerEarning.coins_balance + earnedPassiveCoins;

            if (earnedPassiveCoins != 0) {
                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: earnedPassiveCoins,
                        type: "PASSIVE_EARNINGS",
                        data: yaml.dump({
                            nominal: earnedPassiveCoins,
                            previous_balance: playerEarning.coins_balance,
                            previous_total: playerEarning.coins_total,
                            new_balance: playerEarning.coins_balance + earnedPassiveCoins,
                            new_total: playerEarning.coins_total + earnedPassiveCoins,
                            note: "Tap earnings"
                        }),
                        created_at_unix: currentTimeInSeconds,
                    }
                });
            }

            /* handle tap earnings */
            let availableTapAmount = Math.min(
                playerEarning.tap_earning_energy_available + elapsedTime * playerEarning.tap_earning_energy_recovery,
                playerEarning.tap_earning_energy
            );
            if (tapCount > 0) {
                // Update coins based on tap earnings
                const tapEarnings = Math.min(tapCount * playerEarning.tap_earning_value, availableTapAmount);
                totalCoins += tapEarnings;
                balanceCoins += tapEarnings;

                // Update available taps
                availableTapAmount -= tapEarnings;

                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: tapEarnings,
                        type: "TAP_EARNINGS",
                        data: yaml.dump({
                            nominal: tapEarnings,
                            previous_balance: playerEarning.coins_balance,
                            previous_total: playerEarning.coins_total,
                            new_balance: playerEarning.coins_balance + tapEarnings,
                            new_total: playerEarning.coins_total + tapEarnings,
                            note: "Tap earnings"
                        }),
                        created_at_unix: currentTimeInSeconds,
                    }
                });
            }

            /* update player earning */
            if (earnedPassiveCoins != 0 || tapCount > 0) {
                await prisma.playerEarning.update({
                    where: { id: playerEarning.id },
                    data: {
                        tap_earning_energy_available: availableTapAmount,
                        coins_total: totalCoins,
                        coins_balance: balanceCoins,
                        updated_at_unix: currentTimeInSeconds,
                    }
                });
            }

            // Fetch and determine player level
            let levelData = {
                current_level: null,
                current_level_name: null,
                current_level_image_url: null,
                current_level_score: null,
                next_level: null,
                next_level_name: null,
                next_level_image_url: null,
                next_level_score: null,
                next_level_percentage: null
            };
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });

            if (levelConfig) {
                const levels = yaml.load(levelConfig.value);
                const currentLevelScore = totalCoins - balanceCoins;

                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= currentLevelScore ? level : acc;
                }, levels[0]);

                const nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                levelData.current_level = currentLevel.level;
                levelData.current_level_name = currentLevel.name;
                levelData.current_level_image_url = currentLevel.image_url;
                levelData.current_level_score = currentLevelScore;
                if (nextLevel) {
                    levelData.next_level = nextLevel.level;
                    levelData.next_level_name = nextLevel.name;
                    levelData.next_level_image_url = nextLevel.image_url;
                    levelData.next_level_score = nextLevel.minimum_score;
                    levelData.next_level_percentage = Math.floor(((currentLevelScore - currentLevel.minimum_score) / (nextLevel.minimum_score - currentLevel.minimum_score)) * 100);
                }
            }

            // Construct response
            const response = {
                passive_earnings: {
                    per_hour: playerEarning.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: earnedPassiveCoins,
                },
                tap_earnings: {
                    per_tap: playerEarning.tap_earning_value,
                    max_taps: playerEarning.tap_earning_energy,
                    available_taps: availableTapAmount,
                    recovery_per_second: playerEarning.tap_earning_energy_recovery,
                },
                level: levelData,
                total_coins: totalCoins,
                balance: balanceCoins,
                coupons_balance: playerEarning.coupons_balance/100,
                last_sync: currentTimeInSeconds,
            };

            return res.status(200).json({
                status: true,
                message: "Player earnings updated successfully",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    },

    referralStats: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const referralStats = await prisma.$queryRawUnsafe(`
            SELECT
                p.first_name,
                p.last_name,
                p.level,
                pe.coins_balance AS balance_coins,
                pe.passive_per_hour AS earn_passive_per_hour
            FROM
                players p
            INNER JOIN
                player_earnings pe ON pe.player_id = p.id
            WHERE
                p.referee_id = ${playerId};`);

            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            let levels = yaml.load(levelConfig.value);

            referralStats.forEach(referral => {
                let referralBonus = 0;
                levels.forEach(level => {
                    if (level.level <= referral.level) {
                        referralBonus += level.level_up_reward;
                    }
                });

                referral.referral_bonus_coins = referralBonus;
            });

            return res.status(200).json({
                status: true,
                message: "Referral stats found",
                error: null,
                data: {
                    count: referralStats.length,
                    stats: referralStats
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
