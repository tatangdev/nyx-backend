const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

function buildTree(data, refereeId = null) {
    return data
        .filter(user => user.referee_id === refereeId)
        .map(user => ({
            id: user.id,
            username: user.username,
            name: `${user.first_name} ${user.last_name}`,
            level: user.level,
            referral: buildTree(data, user.id)
        }));
}

// function buildTree(data, refereeId) {
//     return data
//         .filter(user => user.referee_id === refereeId)
//         .map(user => ({
//             username: user.username,
//             referral: buildTree(data, user.id)
//         }));
// }

// function buildFullNetwork(data) {
//     return data.map(user => ({
//         username: user.username,
//         referral: buildTree(data, user.id)
//     }));
// }

module.exports = {
    index: async (req, res, next) => {
        try {
            let additionalCondition = '';
            if (req.query.search) {
                additionalCondition += ` AND (p.first_name ILIKE '%a%' OR p.last_name ILIKE '%a%' OR p.username ILIKE '%a%')`;
            }

            let players = await prisma.$queryRawUnsafe(`
            WITH upgraded_card_cnt AS (
                SELECT player_id, COUNT(player_id)
                FROM card_levels
                GROUP BY player_id
            )
            SELECT
                p.*,
                pe.coins_balance AS points_balance,
                pe.coins_total AS points_total,
                pe.coins_total - pe.coins_balance AS spending_amount,
                pe.passive_per_hour AS profit_per_hour,
                CAST(ucc.count AS INTEGER) AS upgraded_card_cnt
            FROM players p
            INNER JOIN player_earnings pe ON pe.player_id = p.id
            LEFT JOIN upgraded_card_cnt ucc ON ucc.player_id = p.id
            WHERE 1=1 ${additionalCondition}`);

            return res.status(200).json({
                status: true,
                message: "Players found",
                error: null,
                data: players
            });
        } catch (err) {
            next(err);
        }
    },

    show: async (req, res, next) => {
        try {
            let playerId = parseInt(req.params.id);
            let player = await prisma.player.findUnique({
                where: { id: playerId },
            });
            if (!player) {
                return res.status(404).json({
                    status: false,
                    message: "Player not found",
                    error: null,
                    data: null,
                });
            }

            let response = {
                ...player,
                points_balance: 0,
                points_total: 0,
                spending_amount: 0,
                profit_per_hour: 0
            };

            let playerEarnings = await prisma.playerEarning.findFirst({
                where: { player_id: playerId }
            });
            if (playerEarnings) {
                response.points_balance = playerEarnings.coins_balance;
                response.points_total = playerEarnings.coins_total;
                response.spending_amount = playerEarnings.coins_total - playerEarnings.coins_balance;
                response.profit_per_hour = playerEarnings.passive_per_hour;
            }

            return res.status(200).json({
                status: true,
                message: "Card found",
                error: null,
                data: response,
            });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const today = moment().tz(TIMEZONE);
            let playerId = parseInt(req.params.id);
            let { points_balance: pointsBalance } = req.body;

            let player = await prisma.player.findUnique({
                where: { id: playerId },
            });
            if (!player) {
                return res.status(404).json({
                    status: false,
                    message: "Player not found",
                    error: null,
                    data: null,
                });
            }

            let response = {
                ...player,
                points_balance: 0,
                points_total: 0,
                spending_amount: 0,
                profit_per_hour: 0
            };

            let playerEarning = await prisma.playerEarning.findFirst({
                where: { player_id: playerId }
            });
            if (playerEarning) {
                response.points_balance = playerEarning.coins_balance;
                response.points_total = playerEarning.coins_total;
                response.spending_amount = playerEarning.coins_total - playerEarning.coins_balance;
                response.profit_per_hour = playerEarning.passive_per_hour;
            }

            let newPointsBalance = pointsBalance || response.points_balance;
            let pointNominalUpdate = newPointsBalance - response.points_balance;

            if (pointNominalUpdate > 0) {
                await prisma.$transaction(async (prisma) => {
                    await prisma.playerEarning.update({
                        where: { id: playerEarning.id },
                        data: {
                            coins_balance: newPointsBalance,
                            coins_total: response.points_total + pointNominalUpdate,
                            updated_at_unix: today.unix()
                        }
                    });

                    await prisma.pointHistory.create({
                        data: {
                            player_id: playerId,
                            amount: pointNominalUpdate,
                            type: "ADMIN_UPDATE",
                            data: JSON.stringify({
                                nominal: pointNominalUpdate,
                                previous_balance: response.points_balance,
                                new_balance: newPointsBalance,
                                previous_total: response.points_total,
                                new_total: response.points_total + pointNominalUpdate
                            })
                        }
                    });
                });
            }

            return res.status(200).json({
                status: true,
                message: "Player updated",
                error: null,
                data: response,
            });
        } catch (err) {
            next(err);
        }
    },

    network: async (req, res, next) => {
        try {
            let users = await prisma.player.findMany();

            return res.status(200).json({
                status: true,
                message: "Network found",
                error: null,
                data: [
                    {
                        id: null,
                        username: "chipmunkkombat",
                        name: "Chipmunk Kombat",
                        level: null,
                        referral: buildTree(users)
                    }
                ]
            });
        } catch (error) {
            next(error);
        }
    }
};