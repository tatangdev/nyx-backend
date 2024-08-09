const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    index: async (req, res, next) => {
        try {
            let [counter, levels, spends] = await Promise.all([
                prisma.$queryRaw`
                    SELECT
                        CAST((SELECT COUNT(*) FROM players) AS INTEGER) AS player_cnt,
                        CAST((SELECT COUNT(*) FROM card_categories) AS INTEGER) AS card_category_cnt,
                        CAST((SELECT COUNT(*) FROM cards) AS INTEGER) AS card_cnt;
                `,
                prisma.$queryRaw`
                    SELECT * FROM configs WHERE key = 'level'
                `,
                prisma.$queryRaw`
                    SELECT players.id, points.spend_amount, points.amount
                    FROM players
                    LEFT JOIN points ON points.player_id = players.id
                `
            ]);

            let parsedLevels = JSON.parse(levels[0]?.value || '[]');
            let levelCnt = parsedLevels.length;

            let playerLevelCnt = parsedLevels.map(level => ({
                level: level.level,
                count: 0
            }));

            let spendAmount = 0;
            let pointAmount = 0;

            spends.forEach(player => {
                spendAmount += player.spend_amount || 0;
                pointAmount += player.amount || 0;

                let currentLevel = parsedLevels.reduce((acc, level) => (
                    level.minimum_score <= player.spend_amount ? level : acc
                ), parsedLevels[0]);

                let playerLevel = playerLevelCnt.find(pl => pl.level === currentLevel.level);
                if (playerLevel) {
                    playerLevel.count++;
                }
            });

            return res.json({
                status: true,
                message: "Dashboard data",
                error: null,
                data: {
                    player_count: counter[0]?.player_cnt || 0,
                    card_category_count: counter[0]?.card_category_cnt || 0,
                    card_count: counter[0]?.card_cnt || 0,
                    level_count: levelCnt,
                    player_level_count: playerLevelCnt,
                    spend_amount: spendAmount,
                    point_amount: pointAmount
                }
            });

        } catch (error) {
            next(error);
        }
    }
};
