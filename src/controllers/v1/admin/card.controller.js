const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    create: async (req, res, next) => {
        try {
            let { name, icon_url, category_id } = req.body;
            if (!name || !icon_url || !category_id) {
                return res.status(400).json({
                    status: false,
                    message: "Name, icon_url and category_id are required",
                    error: null,
                    data: null
                });
            }

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
                    category_id: category_id
                }
            });


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
            let { name, icon_url, category_id } = req.body;

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