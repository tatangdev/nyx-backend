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
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${req.user.id}
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
                    let levels = JSON.parse(card.levels);
                    let currentLevel = levels.find(item => item.level === card.level);
                    let nextLevel = levels.find(item => item.level === card.level + 1);

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

    listV2: async (req, res, next) => {
        try {
            let filter = '1=1';
            if (req.query.category_id) {
                filter += ` AND category_id = ${parseInt(req.query.category_id)}`;
            }

            let categories = await prisma.cardCategory.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                }
            });

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.icon_url, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    c.levels,
                    c.requirements
                FROM
                    cards c
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE ${filter}
                    AND c.is_active
                    AND cat.is_active
                ORDER BY c.id;
            `);

            cards = cards.map(card => {
                card.upgrade = null;
                card.profit_per_hour = 0;

                if (card.levels) {
                    let levels = JSON.parse(card.levels);
                    let currentLevel = levels.find(item => item.level === card.level);
                    let nextLevel = levels.find(item => item.level === card.level + 1);

                    if (currentLevel) {
                        card.level = currentLevel.level;
                        card.profit_per_hour = currentLevel.profit_per_hour;
                    }
                    if (nextLevel) {
                        let isAvailable = true;
                        let condition = JSON.parse(card.requirements);
                        if (condition) {
                            isAvailable = false;
                            let requiredCard = cards.find(item => item.id === condition.id);
                            if (requiredCard && requiredCard.level >= condition.level) {
                                isAvailable = true;
                            }
                        }

                        card.upgrade = {
                            level: nextLevel.level,
                            price: nextLevel.upgrade_price,
                            profit_per_hour: nextLevel.profit_per_hour,
                            profit_per_hour_delta: nextLevel.profit_per_hour - card.profit_per_hour,
                            is_available: isAvailable,
                            condition
                        };
                    }
                }

                delete card.levels;
                delete card.requirements;
                return card;
            });

            return res.status(200).json({
                status: true,
                message: "Cards found",
                error: null,
                data: { categories, cards }
            });
        } catch (error) {
            next(error);
        }
    },

    upgrade: async (req, res, next) => {
        try {
            let cardId = parseInt(req.body.card_id);

            let cards = await prisma.$queryRawUnsafe(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.icon_url, 
                    COALESCE(CAST(cl.level AS INTEGER), 0) AS level,
                    cat.id AS category_id,
                    c.levels,
                    c.requirements
                FROM
                    cards c
                LEFT JOIN 
                    card_levels cl ON cl.card_id = c.id AND cl.player_id = ${req.user.id}
                INNER JOIN 
                    card_categories cat ON cat.id = c.category_id
                WHERE c.is_active
                    AND cat.is_active
                ORDER BY c.id;
            `);

            let card = cards.find(item => item.id === cardId);
            if (!card) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null
                });
            }


            card.upgrade = null;
            card.profit_per_hour = 0;

            if (card.levels) {
                let levels = JSON.parse(card.levels);
                let currentLevel = levels.find(item => item.level === card.level);
                let nextLevel = levels.find(item => item.level === card.level + 1);

                if (currentLevel) {
                    card.level = currentLevel.level;
                    card.profit_per_hour = currentLevel.profit_per_hour;
                }
                if (nextLevel) {
                    let isAvailable = true;
                    let condition = JSON.parse(card.requirements);
                    if (condition) {
                        isAvailable = false;
                        let requiredCard = cards.find(item => item.id === condition.id);
                        if (requiredCard && requiredCard.level >= condition.level) {
                            isAvailable = true;
                        }
                    }

                    card.upgrade = {
                        level: nextLevel.level,
                        price: nextLevel.upgrade_price,
                        profit_per_hour: nextLevel.profit_per_hour,
                        profit_per_hour_delta: nextLevel.profit_per_hour - card.profit_per_hour,
                        is_available: isAvailable,
                        condition
                    };
                }
            }

            delete card.category_id;
            delete card.levels;
            delete card.requirements;

            if (!card.upgrade || !card.upgrade.is_available) {
                return res.status(400).json({
                    status: false,
                    message: "Card can't be upgraded",
                    error: null,
                    data: null
                });
            }

            await prisma.$transaction(async (prisma) => {
                let point = await prisma.playerEarning.findFirst({
                    where: {
                        player_id: req.user.id
                    }
                });

                if (point.coins_balance < card.upgrade.price) {
                    throw new Error("Insufficient balance");
                }

                let newBalance = point.coins_balance - card.upgrade.price;
                let newProfitPerHour = point.passive_per_hour + card.upgrade.profit_per_hour_delta;

                await prisma.playerEarning.update({
                    where: { id: point.id },
                    data: {
                        coins_balance: newBalance,
                        passive_per_hour: newProfitPerHour,
                    }
                });

                let now = Math.floor(Date.now() / 1000);
                let pointHistory = await prisma.pointHistory.create({
                    data: {
                        player_id: req.user.id,
                        amount: -card.upgrade.price,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        }),
                        created_at_unix: now,
                        updated_at_unix: now,
                    }
                });

                let passiveEarningHistory = await prisma.passiveEarningHistory.create({
                    data: {
                        player_id: req.user.id,
                        amount: card.upgrade.profit_per_hour_delta,
                        type: 'CARD_UPGRADE',
                        data: JSON.stringify({
                            ...card.upgrade,
                            note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                            upgrade_at: new Date()
                        }),
                        created_at_unix: now,
                        updated_at_unix: now,
                    }
                });

                let levelData = card.level_data ? JSON.parse(card.level_data) : [];
                levelData.push({
                    ...card.upgrade,
                    point_history_id: pointHistory.id,
                    passive_earning_history_id: passiveEarningHistory.id,
                    note: `Upgrade card ${card.name} to level ${card.upgrade.level}`,
                    upgrade_at: Math.floor(Date.now() / 1000)
                });

                let cardLevel = await prisma.cardLevel.findFirst({
                    where: {
                        card_id: card.id,
                        player_id: req.user.id
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
                            player_id: req.user.id,
                            level: card.upgrade.level,
                            data: JSON.stringify(levelData),
                            created_at_unix: now,
                            updated_at_unix: now,
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
