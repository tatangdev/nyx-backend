const { PrismaClient } = require('@prisma/client');
const { update } = require('./user.controller');
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

            let coinCategory = await prisma.coinCategory.create({
                data: {
                    name: name,
                    icon_url: icon_url
                }
            });

            return res.status(201).json({
                status: true,
                message: "Coin category created",
                error: null,
                data: coinCategory
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

            let coinCategories = await prisma.coinCategory.findMany(filter);
            return res.status(200).json({
                status: true,
                message: "Coin categories found",
                error: null,
                data: coinCategories
            });

        } catch (error) {
            next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            let coinCategory = await prisma.coinCategory.findUnique({
                where: {
                    id: parseInt(req.params.id)
                }
            });
            return res.status(200).json({
                status: true,
                message: "Coin category found",
                error: null,
                data: coinCategory
            });

        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            let { name, icon_url, is_active } = req.body;
            if (!name && !icon_url) {
                return res.status(400).json({
                    status: false,
                    message: "Name or icon_url is required",
                    error: null,
                    data: null
                });
            }

            let coinCategory = await prisma.coinCategory.update({
                where: {
                    id: parseInt(req.params.id)
                },
                data: {
                    name: name,
                    icon_url: icon_url
                }
            });
            if (!coinCategory) {
                return res.status(404).json({
                    status: false,
                    message: "Coin category not found",
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

            coinCategory = await prisma.coinCategory.update({
                where: {
                    id: parseInt(req.params.id)
                },
                data: data
            });

            return res.status(200).json({
                status: true,
                message: "Coin category updated",
                error: null,
                data: coinCategory
            });

        } catch (error) {
            next(error);
        }
    }
};