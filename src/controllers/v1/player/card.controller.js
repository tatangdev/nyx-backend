const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    list: async (req, res, next) => {
        try {
            let filter = '1=1';
            if (req.query.category_id) {
                filter += ` AND category_id = ${parseInt(req.query.category_id)}`;
            }

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.icon_url, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    cat.name AS category_name,
                    c.levels
                FROM
                    cards c
                    LEFT JOIN card_levels cl ON cl.card_id = c.id AND cl.user_id = ${req.user.id}
                    INNER JOIN card_categories cat ON cat.id = c.category_id
                WHERE ${filter}
                ORDER BY
                    c.id;`);

            cards = cards.map(card => {
                card.upgrade = null;
                card.category = {
                    id: card.category_id,
                    name: card.category_name
                };

                if (card.levels) {
                    const levels = JSON.parse(card.levels);
                    const nextLevel = levels.find(item => item.level === card.level + 1);

                    if (nextLevel) {
                        card.upgrade = {
                            level: nextLevel.level,
                            uprade_price: nextLevel.uprade_price,
                            profit_per_hour: nextLevel.profit_per_hour
                        };
                    }
                }

                delete card.category_id;
                delete card.category_name;
                delete card.levels;
                return card;
            });

            return res.status(200).json({
                status: true,
                message: "Cards found",
                error: null,
                data: cards
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message,
                data: null
            });
        }
    },

    upgrade: async (req, res, next) => {
        try {
            let card = await prisma.card.findUnique({
                where: {
                    id: parseInt(req.body.card_id)
                }
            });
            if (!card) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null
                });
            }





            card.levels = JSON.parse(card.levels);
            return res.status(200).json({
                status: true,
                message: "Card found",
                error: null,
                data: card
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message,
                data: null
            });
        }
    }
};