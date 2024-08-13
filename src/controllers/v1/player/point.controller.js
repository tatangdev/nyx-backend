const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    update: async (req, res, next) => {
        try {
            let { amount, timestamp } = req.body;
            let playerId = req.user.id;

            let playerDataResult = await prisma.$queryRawUnsafe(`
                SELECT p.*, (
                    SELECT COALESCE(MAX(unix_time), 0)
                    FROM point_logs
                    WHERE player_id = p.player_id
                ) AS point_last_update
                FROM players pl
                INNER JOIN points p ON pl.id = p.player_id
                WHERE p.id = ${playerId};`
            );

            if (playerDataResult.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Player not found",
                    error: null,
                    data: null
                });
            }

            let playerData = playerDataResult[0];

            if (timestamp <= playerData.point_last_update) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid timestamp",
                    error: null,
                    data: null
                });
            }

            // Update player points
            await prisma.point.update({
                where: { id: playerData.id },
                data: { amount: playerData.amount + amount }
            });

            // Add player point log
            await prisma.pointLog.create({
                data: {
                    player_id: playerData.player_id,
                    amount: amount,
                    unix_time: timestamp,
                    type: "profit"
                }
            });

            return res.status(200).json({
                status: true,
                message: "Player point updated",
                error: null,
                data: {
                    point_amount: playerData.amount,
                    added_point: amount,
                    point_last_update: timestamp
                }
            });
        } catch (error) {
            next(error);
        }
    },

    updatePreview: async (req, res, next) => {
        try {
            let playerId = req.user.id;

            let now = Math.floor(Date.now() / 1000);
            let playerEarningResult = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            let playerEarning = playerEarningResult[0];
            let durationInSeconds = now - playerEarning.last_updated;
            let claimablePoints = Math.floor(playerEarning.profit_per_hour * (durationInSeconds / 3600));

            return res.status(200).json({
                status: true,
                message: "Player point updated",
                error: null,
                data: {
                    point_amount: playerEarning.amount,
                    claimable_point: claimablePoints,
                    point_last_update: playerEarning.point_last_update,
                    timestamp: now
                }
            });
        } catch (error) {
            next(error);
        }
    },

    sync: async (req, res, next) => {
        try {
            let playerId = req.user.id;
            let { tap_count, available_taps, timestamp } = req.body;
            let playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            let now = Math.floor(Date.now() / 1000);
            // validate tap data
            if (tap_count > 0) {
                if (available_taps <= 0 || timestamp <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "Invalid tap data",
                        error: null,
                        data: null
                    });
                }

                if (timestamp >= now) {
                    return res.status(400).json({
                        status: false,
                        message: "Invalid timestamp",
                        error: null,
                        data: null
                    });
                }

                if (tap_count > playerEarning.available_taps) {
                    return res.status(400).json({
                        status: false,
                        message: "Insufficient available taps",
                        error: null,
                        data: null
                    });
                }

                if (tap_count + available_taps > playerEarning.tap_max) {
                    return res.status(400).json({
                        status: false,
                        message: "Exceeded maximum taps",
                        error: null,
                        data: null
                    });
                }

                now = timestamp;
            }

            // passive earnings
            let maxPassiveEarningsDurationMinutes = 180; // todo: get from config
            let lastUpdatedDuration = now - playerEarning.last_updated <= maxPassiveEarningsDurationMinutes * 60 ? now - playerEarning.last_updated : maxPassiveEarningsDurationMinutes * 60;
            let passiveEarningsPerSecond = playerEarning.passive_per_hour / 3600;
            let passiveEarningsLastEarned = Math.floor(lastUpdatedDuration * passiveEarningsPerSecond);

            // tap earnings
            let tapEarningsRecoveryPerSecond = 3; // todo: get from config
            let tapEarningAvailable = playerEarning.tap_available + (now - playerEarning.last_updated) * tapEarningsRecoveryPerSecond <= playerEarning.tap_max ? playerEarning.tap_available + (now - playerEarning.last_updated) * tapEarningsRecoveryPerSecond : playerEarning.tap_max;

            // earnings
            let totalCoins = playerEarning.coins_total + passiveEarningsLastEarned;
            let balanceCoins = playerEarning.coins_balance + passiveEarningsLastEarned;

            // update player earning
            await prisma.playerEarning.update({
                where: { id: playerEarning.id },
                data: {
                    tap_available: tapEarningAvailable,
                    coins_total: totalCoins,
                    coins_balance: balanceCoins,
                    last_updated: now,
                }
            });

            let response = {
                passive_earnings: {
                    per_hour: playerEarning.passive_per_hour,
                    per_second: passiveEarningsPerSecond,
                    last_earned: passiveEarningsLastEarned,
                },
                tap_earnings: {
                    per_tap: playerEarning.tap_points,
                    max_taps: playerEarning.tap_max,
                    available_taps: tapEarningAvailable,
                    recovery_per_second: tapEarningsRecoveryPerSecond,
                },
                total_coins: totalCoins,
                balance: balanceCoins,
                last_sync: now,
            };

            return res.status(200).json({
                status: true,
                message: "Player point updated",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    }
};
