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
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.user_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE ${filter}
                    AND c.is_active
                    AND cat.is_active
                ORDER BY c.id;
            `);

            cards = cards.map(card => {
                card.upgrade = null;
                card.current = {
                    level: card.level,
                    profit_per_hour: 0
                };
                card.category = {
                    id: card.category_id,
                    name: card.category_name
                };

                if (card.levels) {
                    const levels = JSON.parse(card.levels);
                    const currentLevel = levels.find(item => item.level === card.level);
                    const nextLevel = levels.find(item => item.level === card.level + 1);

                    if (currentLevel) {
                        card.current = {
                            level: currentLevel.level,
                            profit_per_hour: currentLevel.profit_per_hour
                        };
                    }
                    if (nextLevel) {
                        card.upgrade = {
                            level: nextLevel.level,
                            upgrade_price: nextLevel.upgrade_price,
                            profit_per_hour: nextLevel.profit_per_hour
                        };
                    }
                }

                delete card.level;
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
            const cardId = parseInt(req.body.card_id);

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
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.user_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE c.id = ${cardId}
                ORDER BY c.id;
            `);

            if (!cards || cards.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null
                });
            }

            let card = cards[0];

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
                        upgrade_price: nextLevel.upgrade_price,
                        profit_per_hour: nextLevel.profit_per_hour
                    };
                }
            }

            delete card.category_id;
            delete card.category_name;
            delete card.levels;

            if (!card.upgrade) {
                return res.status(400).json({
                    status: false,
                    message: "Card can't be upgraded",
                    error: null,
                    data: null
                });
            }

            await prisma.$transaction(async (prisma) => {
                let point = await prisma.point.findFirst({
                    where: {
                        player_id: req.user.id
                    }
                });

                if (!point) {
                    throw new Error("Point not found");
                }

                if (point.amount < card.upgrade.upgrade_price) {
                    throw new Error("Insufficient balance");
                }

                const newBalance = point.amount - card.upgrade.upgrade_price;
                const newProfitPerHour = point.profit_per_hour + card.upgrade.profit_per_hour;

                await prisma.point.update({
                    where: { id: point.id },
                    data: {
                        amount: newBalance,
                        profit_per_hour: newProfitPerHour
                    }
                });

                const pointHistory = await prisma.pointHistory.create({
                    data: {
                        player_id: req.user.id,
                        point_id: point.id,
                        amount: -card.upgrade.upgrade_price,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        })
                    }
                });

                let levelData = card.level_data ? JSON.parse(card.level_data) : [];
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
                    await prisma.cardLevel.update({
                        where: { id: cardLevel.id },
                        data: {
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData)
                        }
                    });
                } else {
                    await prisma.cardLevel.create({
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
