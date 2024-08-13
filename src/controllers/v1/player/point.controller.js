const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    sync: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const { tap_count: tapCount, timestamp } = req.body;

            // Fetch the player's current earnings from the database
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            let currentTimeInSeconds = Math.floor(Date.now() / 1000);

            // Validate tap data and timestamp
            if (tapCount > 0) {
                if (timestamp <= 0 || timestamp <= playerEarning.last_updated || timestamp >= currentTimeInSeconds) {
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
            const maxPassiveEarningsDurationMinutes = 180; // TODO: Move this to a config file
            const elapsedTimeSinceLastUpdate = currentTimeInSeconds - playerEarning.last_updated;
            const passiveEarningsDuration = Math.min(elapsedTimeSinceLastUpdate, maxPassiveEarningsDurationMinutes * 60);
            const passiveEarningsPerSecond = playerEarning.passive_per_hour / 3600;
            const passiveEarningsSinceLastUpdate = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // Update total and balance coins with passive earnings
            let totalCoins = playerEarning.coins_total + passiveEarningsSinceLastUpdate;
            let balanceCoins = playerEarning.coins_balance + passiveEarningsSinceLastUpdate;

            // Calculate available tap earnings
            const tapEarningsRecoveryRate = 3; // TODO: Move this to a config file
            let availableTapEarnings = Math.min(
                playerEarning.tap_available + elapsedTimeSinceLastUpdate * tapEarningsRecoveryRate,
                playerEarning.tap_max
            );

            if (tapCount > 0) {
                const validTapCount = Math.min(tapCount, availableTapEarnings);

                // Deduct used taps and update total and balance coins
                const tapEarnings = validTapCount * playerEarning.tap_points;
                totalCoins += tapEarnings;
                balanceCoins += tapEarnings;

                // Update available taps
                availableTapEarnings -= validTapCount;
            }

            // Update player earnings in the database
            await prisma.playerEarning.update({
                where: { id: playerEarning.id },
                data: {
                    tap_available: availableTapEarnings,
                    coins_total: totalCoins,
                    coins_balance: balanceCoins,
                    last_updated: currentTimeInSeconds,
                }
            });

            // Construct response data
            const response = {
                passive_earnings: {
                    per_hour: playerEarning.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: passiveEarningsSinceLastUpdate,
                },
                tap_earnings: {
                    per_tap: playerEarning.tap_points,
                    max_taps: playerEarning.tap_max,
                    available_taps: availableTapEarnings,
                    recovery_per_second: tapEarningsRecoveryRate,
                },
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
