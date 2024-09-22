const prisma = require('../../../libs/prisma');
const yaml = require('js-yaml');

module.exports = {
    index: async (req, res, next) => {
        try {
            let playerId = req.user.id;
            let player = await prisma.player.findFirst({ where: { id: playerId } });
            let level = Number(req.query.level) || player.level;

            let levelConfig = await prisma.config.findFirst({ where: { key: `level` } });
            let levelConfigValue = yaml.load(levelConfig.value);
            let currentLevel = levelConfigValue.find(l => l.level === level);
            let nextLevel = levelConfigValue.find(l => l.level === level + 1);

            const results = await prisma.$queryRaw`
                WITH RankedPlayers AS (
                    SELECT
                        p.id,
                        p.username,
                        p.first_name,
                        p.last_name,
                        CAST(DENSE_RANK() OVER (
                            ORDER BY pe.coins_total - pe.coins_balance DESC, p.id ASC
                        ) AS INTEGER) AS rank,
                        CAST(pe.coins_total - pe.coins_balance AS INTEGER) AS spending_amount,
                        pe.passive_per_hour
                    FROM players p
                    INNER JOIN player_earnings pe ON pe.player_id = p.id
                    WHERE p.level = ${level}
                ),
                TopPlayers AS (
                    SELECT * FROM RankedPlayers WHERE rank <= 100 and id != ${playerId}
                ),
                SpecificPlayer AS (
                    SELECT * FROM RankedPlayers WHERE id = ${playerId}
                )
                SELECT * FROM TopPlayers
                UNION ALL
                SELECT * FROM SpecificPlayer
                ORDER BY rank;
            `;

            const myRank = results.find(r => r.id === playerId);
            const topUsers = results;

            return res.status(200).json({
                status: true,
                message: "Player rank retrieved successfully",
                error: null,
                data: {
                    level,
                    level_name: currentLevel.name,
                    level_image: currentLevel.image_url,
                    level_minimum_score: currentLevel.minimum_score,
                    next_level_percentage: nextLevel && topUsers.length && myRank ? Math.floor(((myRank.spending_amount - currentLevel.minimum_score) / (nextLevel.minimum_score - currentLevel.minimum_score)) * 100) : null,
                    my_rank: myRank ? myRank.rank : null,
                    top_users: topUsers
                }
            });
        } catch (error) {
            next(error);
        }
    }
};