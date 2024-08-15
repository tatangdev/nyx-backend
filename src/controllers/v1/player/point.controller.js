const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    sync: async (req, res, next) => {
        try {
            const playerId = req.user.id;

            // Fetch player's current earnings
            const playerEarnings = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            let currentTimeInSeconds = Math.floor(Date.now() / 1000);

            // Calculate passive earnings
            const MAX_PASSIVE_EARNINGS_DURATION = 180 * 60; // 180 minutes in seconds
            const elapsedTime = currentTimeInSeconds - playerEarnings.updated_at_unix;
            const passiveEarningsDuration = Math.min(elapsedTime, MAX_PASSIVE_EARNINGS_DURATION);
            const passiveEarningsPerSecond = playerEarnings.passive_per_hour / 3600;
            const earnedPassiveCoins = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // Update total and balance coins
            let totalCoins = playerEarnings.coins_total + earnedPassiveCoins;
            let balanceCoins = playerEarnings.coins_balance + earnedPassiveCoins;

            // Calculate available tap earnings
            const TAP_RECOVERY_RATE = 3; // Taps recovered per second
            let availableTaps = Math.min(
                playerEarnings.tap_available + elapsedTime * TAP_RECOVERY_RATE,
                playerEarnings.tap_max
            );

            // Update player earnings in the database
            await prisma.playerEarning.update({
                where: { id: playerEarnings.id },
                data: {
                    tap_available: availableTaps,
                    coins_total: totalCoins,
                    coins_balance: balanceCoins,
                    created_at_unix: currentTimeInSeconds,
                    updated_at_unix: currentTimeInSeconds,
                }
            });
            await prisma.pointHistory.create({
                data: {
                    player_id: playerId,
                    amount: earnedPassiveCoins,
                    type: "PASSIVE_EARNINGS",
                    data: JSON.stringify({ note: "Passive earnings" }),
                    created_at_unix: currentTimeInSeconds,
                    updated_at_unix: currentTimeInSeconds,
                }
            });

            // Fetch and determine player level
            let levelData = {
                current_level: null,
                current_level_score: null,
                next_level: null,
                next_level_score: null,
                next_level_percentage: null
            };
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });

            if (levelConfig) {
                const levels = JSON.parse(levelConfig.value);
                const currentLevelScore = totalCoins - balanceCoins;

                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= currentLevelScore ? level : acc;
                }, levels[0]);

                const nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                levelData.current_level = currentLevel.level;
                levelData.current_level_score = currentLevelScore;
                if (nextLevel) {
                    levelData.next_level = nextLevel.level;
                    levelData.next_level_score = nextLevel.minimum_score;
                    levelData.next_level_percentage = Math.floor((currentLevelScore / nextLevel.minimum_score) * 100);
                }
            }

            // Construct response
            const response = {
                passive_earnings: {
                    per_hour: playerEarnings.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: earnedPassiveCoins,
                },
                tap_earnings: {
                    per_tap: playerEarnings.tap_points,
                    max_taps: playerEarnings.tap_max,
                    available_taps: availableTaps,
                    recovery_per_second: TAP_RECOVERY_RATE,
                },
                level: levelData,
                total_coins: totalCoins,
                balance: balanceCoins,
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

    tapUpdate: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const { tap_count: tapCount, timestamp } = req.body;

            // Fetch player's current earnings
            const playerEarnings = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            let currentTimeInSeconds = Math.floor(Date.now() / 1000);

            // Validate tap data and timestamp
            if (tapCount > 0) {
                const isInvalidTimestamp = timestamp <= 0 || timestamp <= playerEarnings.updated_at_unix || timestamp >= currentTimeInSeconds;
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

            // Calculate passive earnings
            const MAX_PASSIVE_EARNINGS_DURATION = 180 * 60; // 180 minutes in seconds
            const elapsedTime = currentTimeInSeconds - playerEarnings.updated_at_unix;
            const passiveEarningsDuration = Math.min(elapsedTime, MAX_PASSIVE_EARNINGS_DURATION);
            const passiveEarningsPerSecond = playerEarnings.passive_per_hour / 3600;
            const earnedPassiveCoins = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // Update total and balance coins
            let totalCoins = playerEarnings.coins_total + earnedPassiveCoins;
            let balanceCoins = playerEarnings.coins_balance + earnedPassiveCoins;

            // Calculate available tap earnings
            const TAP_RECOVERY_RATE = 3; // Taps recovered per second
            let availableTaps = Math.min(
                playerEarnings.tap_available + elapsedTime * TAP_RECOVERY_RATE,
                playerEarnings.tap_max
            );

            if (tapCount > 0) {
                const validTapCount = Math.min(tapCount, availableTaps);

                // Update coins based on tap earnings
                const tapEarnings = validTapCount * playerEarnings.tap_points;
                totalCoins += tapEarnings;
                balanceCoins += tapEarnings;

                // Update available taps
                availableTaps -= validTapCount;


                await prisma.pointHistory.create({
                    data: {
                        player_id: playerId,
                        amount: tapEarnings,
                        type: "TAP_EARNINGS",
                        data: JSON.stringify({ note: "tap earnings" }),
                        created_at_unix: currentTimeInSeconds,
                        updated_at_unix: currentTimeInSeconds,
                    }
                });
            }

            // Update player earnings in the database
            await prisma.playerEarning.update({
                where: { id: playerEarnings.id },
                data: {
                    tap_available: availableTaps,
                    coins_total: totalCoins,
                    coins_balance: balanceCoins,
                    created_at_unix: currentTimeInSeconds,
                    updated_at_unix: currentTimeInSeconds,
                }
            });
            await prisma.pointHistory.create({
                data: {
                    player_id: playerId,
                    amount: earnedPassiveCoins,
                    type: "PASSIVE_EARNINGS",
                    data: JSON.stringify({ note: "Passive earnings" }),
                    created_at_unix: currentTimeInSeconds,
                    updated_at_unix: currentTimeInSeconds,
                }
            });

            // Fetch and determine player level
            let levelData = {
                current_level: null,
                current_level_score: null,
                next_level: null,
                next_level_score: null,
                next_level_percentage: null
            };
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });

            if (levelConfig) {
                const levels = JSON.parse(levelConfig.value);
                const currentLevelScore = totalCoins - balanceCoins;

                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= currentLevelScore ? level : acc;
                }, levels[0]);

                const nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                levelData.current_level = currentLevel.level;
                levelData.current_level_score = currentLevelScore;
                if (nextLevel) {
                    levelData.next_level = nextLevel.level;
                    levelData.next_level_score = nextLevel.minimum_score;
                    levelData.next_level_percentage = Math.floor((currentLevelScore / nextLevel.minimum_score) * 100);
                }
            }

            // Construct response
            const response = {
                passive_earnings: {
                    per_hour: playerEarnings.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: earnedPassiveCoins,
                },
                tap_earnings: {
                    per_tap: playerEarnings.tap_points,
                    max_taps: playerEarnings.tap_max,
                    available_taps: availableTaps,
                    recovery_per_second: TAP_RECOVERY_RATE,
                },
                level: levelData,
                total_coins: totalCoins,
                balance: balanceCoins,
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
    }
};
