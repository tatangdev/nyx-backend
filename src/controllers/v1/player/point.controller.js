const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    update: async (req, res, next) => {
        try {
            const { amount, timestamp } = req.body;
            const playerId = req.user.id;

            const playerDataResult = await prisma.$queryRawUnsafe(`
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

            const playerData = playerDataResult[0];

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
            const playerId = req.user.id;

            const playerDataResult = await prisma.$queryRawUnsafe(`
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

            const playerData = playerDataResult[0];
            const now = Math.floor(Date.now() / 1000);
            const durationInSeconds = now - playerData.point_last_update;
            const claimablePoints = Math.floor(playerData.profit_per_hour * (durationInSeconds / 3600));

            return res.status(200).json({
                status: true,
                message: "Player point updated",
                error: null,
                data: {
                    point_amount: playerData.amount,
                    claimable_point: claimablePoints,
                    point_last_update: playerData.point_last_update,
                    timestamp: now
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
