const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    create: async (req, res, next) => {
        try {
            let { name, icon_url } = req.body;
            if (!name || !icon_url) {
                return res.status(400).json({
                    status: false,
                    message: "Name and icon_url are required",
                    error: null,
                    data: null
                });
            }

            let cardCategory = await prisma.cardCategory.create({
                data: {
                    name: name,
                    icon_url: icon_url
                }
            });

            return res.status(201).json({
                status: true,
                message: "Card category created",
                error: null,
                data: cardCategory
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

            let cardCategories = await prisma.cardCategory.findMany(filter);
            return res.status(200).json({
                status: true,
                message: "Card categories found",
                error: null,
                data: cardCategories
            });

        } catch (error) {
            next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            let cardCategory = await prisma.cardCategory.findUnique({
                where: {
                    id: parseInt(req.params.id)
                }
            });
            return res.status(200).json({
                status: true,
                message: "Card category found",
                error: null,
                data: cardCategory
            });

        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            let { name, icon_url, is_active } = req.body;

            let cardCategory = await prisma.cardCategory.findUnique({
                where: {
                    id: parseInt(req.params.id)
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

            let data = {};
            if (name) {
                data.name = name;
            }
            if (icon_url) {
                data.icon_url = icon_url;
            }
            if (is_active !== undefined) {
                data.is_active = is_active;
            }

            cardCategory = await prisma.cardCategory.update({
                where: {
                    id: parseInt(req.params.id)
                },
                data: data
            });

            return res.status(200).json({
                status: true,
                message: "Card category updated",
                error: null,
                data: cardCategory
            });

        } catch (error) {
            next(error);
        }
    }
};