const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    create: async (req, res, next) => {
        try {
            let { name, icon_url, category_id, levels } = req.body;
            if (!name || !icon_url || !category_id || !levels.length) {
                return res.status(400).json({
                    status: false,
                    message: "Name, icon_url, category_id and levels are required",
                    error: null,
                    data: null
                });
            }

            // validate levels
            levels.forEach((level, index) => {
                if (typeof level.uprade_price !== 'number' || typeof level.profit_per_hour !== 'number') {
                    return res.status(400).json({
                        status: false,
                        message: "uprade_price and profit_per_hour must be a number",
                        error: null,
                        data: null
                    });
                }

                if (level.uprade_price <= 0 || level.profit_per_hour <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "uprade_price and profit_per_hour must be greater than 0",
                        error: null,
                        data: null
                    });
                }

                if (index > 0) {
                    if (level.uprade_price <= levels[index - 1].uprade_price) {
                        return res.status(400).json({
                            status: false,
                            message: "upgrade_price must be greater than previous upgrade_price",
                            error: null,
                            data: null
                        });
                    }

                    if (level.profit_per_hour <= levels[index - 1].profit_per_hour) {
                        return res.status(400).json({
                            status: false,
                            message: "profit_per_hour must be greater than previous profit_per_hour",
                            error: null,
                            data: null
                        });
                    }
                }
            });
            levels = levels.map((level, index) => {
                return { ...level, level: index + 1 };
            });

            let cardCategory = await prisma.cardCategory.findUnique({
                where: {
                    id: category_id
                }
            });
            if (!cardCategory) {
                return res.status(404).json({
                    status: false,
                    message: "Card category not found",
                    error: null,
                    data: null
                });
            }

            let card = await prisma.card.create({
                data: {
                    name: name,
                    icon_url: icon_url,
                    category_id: category_id,
                    levels: JSON.stringify(levels)
                }
            });


            card.levels = JSON.parse(card.levels);
            return res.status(201).json({
                status: true,
                message: "Card category created",
                error: null,
                data: card
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
                    mode: 'insensitive'
                };
            }
            if (req.query.is_active) {
                switch (req.query.is_active) {
                    case 'true':
                        filter.where.is_active = true;
                        break;
                    case 'false':
                        filter.where.is_active = false;
                        break;
                }
            }

            let cards = await prisma.card.findMany(filter);
            cards = cards.map(card => {
                delete card.levels;
                delete card.requirements;
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

    show: async (req, res, next) => {
        try {
            let card = await prisma.card.findUnique({
                where: {
                    id: parseInt(req.params.id)
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
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            let { name, icon_url, category_id, levels } = req.body;

            let card = await prisma.card.findUnique({
                where: {
                    id: parseInt(req.params.id)
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

            let data = {};
            if (name) {
                data.name = name;
            }
            if (icon_url) {
                data.icon_url = icon_url;
            }
            if (category_id) {
                let cardCategory = await prisma.cardCategory.findUnique({
                    where: {
                        id: category_id
                    }
                });
                if (!cardCategory) {
                    return res.status(404).json({
                        status: false,
                        message: "Card category not found",
                        error: null,
                        data: null
                    });
                }

                data.category_id = cardCategory.id;
            }
            if (is_active !== undefined) {
                data.is_active = is_active;
            }
            // validate levels
            if (levels.length) {
                levels.forEach((level, index) => {
                    if (typeof level.uprade_price !== 'number' || typeof level.profit_per_hour !== 'number') {
                        return res.status(400).json({
                            status: false,
                            message: "uprade_price and profit_per_hour must be a number",
                            error: null,
                            data: null
                        });
                    }

                    if (level.uprade_price <= 0 || level.profit_per_hour <= 0) {
                        return res.status(400).json({
                            status: false,
                            message: "uprade_price and profit_per_hour must be greater than 0",
                            error: null,
                            data: null
                        });
                    }

                    if (index > 0) {
                        if (level.uprade_price <= levels[index - 1].uprade_price) {
                            return res.status(400).json({
                                status: false,
                                message: "upgrade_price must be greater than previous upgrade_price",
                                error: null,
                                data: null
                            });
                        }

                        if (level.profit_per_hour <= levels[index - 1].profit_per_hour) {
                            return res.status(400).json({
                                status: false,
                                message: "profit_per_hour must be greater than previous profit_per_hour",
                                error: null,
                                data: null
                            });
                        }
                    }
                });
                levels = levels.map((level, index) => {
                    return { ...level, level: index + 1 };
                });
                data.levels = JSON.stringify(levels);
            }

            let updatedCard = await prisma.card.update({
                where: {
                    id: parseInt(req.params.id)
                },
                data: data
            });

            return res.status(200).json({
                status: true,
                message: "Card updated",
                error: null,
                data: updatedCard
            });

        } catch (error) {
            next(error);
        }
    },
};