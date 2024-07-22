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
            next(error);
        }
    },

    upgrade: async (req, res, next) => {
        try {
            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.icon_url, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    cat.name AS category_name,
                    c.levels,
                    cl.data AS level_data
                FROM
                    cards c
                    LEFT JOIN card_levels cl ON cl.card_id = c.id AND cl.user_id = ${req.user.id}
                    INNER JOIN card_categories cat ON cat.id = c.category_id
                WHERE c.id = ${req.body.card_id}
                ORDER BY
                    c.id;`);
            if (!cards || cards.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null
                });
            }

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

            let card = cards[0];
            if (card.upgrade === null) {
                return res.status(400).json({
                    status: false,
                    message: "Card can't be upgraded",
                    error: null,
                    data: null
                });
            }


            // Start transaction
            await prisma.$transaction(async (prisma) => {
                // Retrieve player points
                let point = await prisma.point.findFirst({
                    where: {
                        player_id: req.user.id
                    }
                });
                if (!point) {
                    throw new Error("Point not found");
                }
                if (point.balance < card.upgrade.uprade_price) {
                    throw new Error("Insufficient balance");
                }

                // Update player points
                let newBalance = point.amount - card.upgrade.uprade_price;
                point = await prisma.point.update({
                    where: {
                        id: point.id
                    },
                    data: {
                        amount: newBalance
                    }
                });

                // Save player points history
                let pointHistory = await prisma.pointHistory.create({
                    data: {
                        player_id: req.user.id,
                        point_id: point.id,
                        amount: -card.upgrade.uprade_price,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        })
                    }
                });

                // Upgrade card
                let levelData = [];
                if (card.level_data) {
                    levelData = JSON.parse(card.level_data);
                }
                levelData.push({
                    ...card.upgrade,
                    history_id: pointHistory.id,
                    note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                    upgrade_at: new Date()
                });

                let cardLevel = await prisma.cardLevel.findFirst({
                    where: {
                        card_id: card.id,
                        user_id: req.user.id
                    }
                });
                if (cardLevel) {
                    cardLevel = await prisma.cardLevel.update({
                        where: {
                            id: cardLevel.id
                        },
                        data: {
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData)
                        }
                    });
                } else {
                    cardLevel = await prisma.cardLevel.create({
                        data: {
                            card_id: card.id,
                            user_id: req.user.id,
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData)
                        }
                    });
                }
            });

            return res.status(200).json({
                status: true,
                message: "Card upgraded successfully",
                error: null,
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
};