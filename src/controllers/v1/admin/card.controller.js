const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

const validateLevels = (levels) => {
    for (let i = 0; i < levels.length; i++) {
        let level = levels[i];
        if (typeof level.upgrade_price !== 'number' || typeof level.profit_per_hour !== 'number') {
            return {
                isValid: false,
                message: "upgrade_price and profit_per_hour must be numbers",
            };
        }
        if (level.upgrade_price <= 0 || level.profit_per_hour <= 0) {
            return {
                isValid: false,
                message: "upgrade_price and profit_per_hour must be greater than 0",
            };
        }
        if (i > 0) {
            if (level.upgrade_price <= levels[i - 1].upgrade_price) {
                return {
                    isValid: false,
                    message: "upgrade_price must be greater than previous upgrade_price",
                };
            }
            if (level.profit_per_hour <= levels[i - 1].profit_per_hour) {
                return {
                    isValid: false,
                    message: "profit_per_hour must be greater than previous profit_per_hour",
                };
            }
        }
    }
    return { isValid: true };
};

module.exports = {
    create: async (req, res, next) => {
        try {
            let { name, icon_url, category_id, levels } = req.body;
            if (!name || !icon_url || !category_id || !levels.length) {
                return res.status(400).json({
                    status: false,
                    message: "Name, icon_url, category_id and levels are required",
                    error: null,
                    data: null,
                });
            }

            let validation = validateLevels(levels);
            if (!validation.isValid) {
                return res.status(400).json({
                    status: false,
                    message: validation.message,
                    error: null,
                    data: null,
                });
            }

            levels = levels.map((level, index) => ({ ...level, level: index + 1 }));

            let cardCategory = await prisma.cardCategory.findUnique({
                where: { id: category_id },
            });
            if (!cardCategory) {
                return res.status(404).json({
                    status: false,
                    message: "Card category not found",
                    error: null,
                    data: null,
                });
            }

            let now = Math.floor(Date.now() / 1000);
            let card = await prisma.card.create({
                data: {
                    name,
                    icon_url,
                    category_id,
                    levels: JSON.stringify(levels),
                    created_at_unix: now,
                    updated_at_unix: now,
                },
            });

            card.levels = JSON.parse(card.levels);
            return res.status(201).json({
                status: true,
                message: "Card created",
                error: null,
                data: card,
            });
        } catch (error) {
            next(error);
        }
    },

    index: async (req, res, next) => {
        try {
            let filter = { where: {} };
            if (req.query.search) {
                filter.where.name = {
                    contains: req.query.search,
                    mode: 'insensitive',
                };
            }
            if (req.query.is_active !== undefined) {
                filter.where.is_active = req.query.is_active === 'true';
            }
            if (req.query.category_id) {
                filter.where.category_id = parseInt(req.query.category_id);
            }

            let cards = await prisma.card.findMany(filter);
            cards = cards.map((card) => {
                delete card.levels;
                delete card.requirements;
                return card;
            });
            return res.status(200).json({
                status: true,
                message: "Cards found",
                error: null,
                data: cards,
            });
        } catch (error) {
            next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            let card = await prisma.card.findUnique({
                where: { id: parseInt(req.params.id) },
            });
            if (!card) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null,
                });
            }

            card.levels = JSON.parse(card.levels);
            return res.status(200).json({
                status: true,
                message: "Card found",
                error: null,
                data: card,
            });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            let { name, icon_url, category_id, levels, is_active } = req.body;

            let card = await prisma.card.findUnique({
                where: { id: parseInt(req.params.id) },
            });
            if (!card) {
                return res.status(404).json({
                    status: false,
                    message: "Card not found",
                    error: null,
                    data: null,
                });
            }

            let data = {};
            if (name) data.name = name;
            if (icon_url) data.icon_url = icon_url;
            if (category_id) {
                let cardCategory = await prisma.cardCategory.findUnique({
                    where: { id: category_id },
                });
                if (!cardCategory) {
                    return res.status(404).json({
                        status: false,
                        message: "Card category not found",
                        error: null,
                        data: null,
                    });
                }
                data.category_id = category_id;
            }
            if (is_active !== undefined) data.is_active = is_active;

            if (levels && levels.length) {
                let validation = validateLevels(levels);
                if (!validation.isValid) {
                    return res.status(400).json({
                        status: false,
                        message: validation.message,
                        error: null,
                        data: null,
                    });
                }
                levels = levels.map((level, index) => ({ ...level, level: index + 1 }));
                data.levels = JSON.stringify(levels);
            }

            let updatedCard = await prisma.card.update({
                where: { id: parseInt(req.params.id) },
                data,
            });

            return res.status(200).json({
                status: true,
                message: "Card updated",
                error: null,
                data: updatedCard,
            });
        } catch (error) {
            next(error);
        }
    },
};
