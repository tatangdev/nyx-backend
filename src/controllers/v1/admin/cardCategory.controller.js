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

            let now = Math.floor(Date.now() / 1000);
            let cardCategory = await prisma.cardCategory.create({
                data: {
                    name,
                    icon_url,
                    created_at_unix: now,
                    updated_at_unix: now,
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
            let { search, is_active } = req.query;

            if (search) {
                filter.where.name = {
                    contains: search,
                    mode: 'insensitive'
                };
            }

            if (is_active !== undefined) {
                filter.where.is_active = is_active === 'true';
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

            if (!cardCategory) {
                return res.status(404).json({
                    status: false,
                    message: "Card category not found",
                    error: null,
                    data: null
                });
            }

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
            let cardCategoryId = parseInt(req.params.id);

            let cardCategory = await prisma.cardCategory.findUnique({
                where: {
                    id: cardCategoryId
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

            let data = {
                ...(name && { name }),
                ...(icon_url && { icon_url }),
                ...(is_active !== undefined && { is_active })
            };

            let updatedCardCategory = await prisma.cardCategory.update({
                where: {
                    id: cardCategoryId
                },
                data
            });

            return res.status(200).json({
                status: true,
                message: "Card category updated",
                error: null,
                data: updatedCardCategory
            });

        } catch (error) {
            next(error);
        }
    }
};
