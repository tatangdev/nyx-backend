const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

function buildTree(data, refereeId = null) {
    return data
        .filter(user => user.referee_id === refereeId)
        .map(user => ({
            id: user.id,
            username: user.username,
            name: `${user.first_name} ${user.last_name}`,
            level: 1, // todo: get level:
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

    network: async (req, res, next) => {
        try {
            let users = await prisma.player.findMany();

            return res.status(200).json({
                status: true,
                message: "Network found",
                error: null,
                data: [
                    {
                        id: 0,
                        username: "chipmunkkombat",
                        name: "Chipmunk Kombat",
                        level: 0, // todo: get level
                        referral: buildTree(users)
                    }
                ]
            });
        } catch (error) {
            next(error);
        }
    }
};