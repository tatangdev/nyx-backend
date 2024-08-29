const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const XLSX = require('xlsx');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

const validateLevels = (levels) => {
    for (let i = 0; i < levels.length; i++) {
        let level = levels[i];

        // validate level keys
        if (
            (level.level !== null && typeof level.level !== 'number') ||
            (level.upgrade_price !== null && typeof level.upgrade_price !== 'number') ||
            (level.profit_per_hour !== null && typeof level.profit_per_hour !== 'number') ||
            (level.profit_per_hour_increase !== null && typeof level.profit_per_hour_increase !== 'number') ||
            (level.price_multiplier !== null && typeof level.price_multiplier !== 'number') ||
            (level.profit_per_hour_multiplier !== null && typeof level.profit_per_hour_multiplier !== 'number') ||
            (level.respawn_time !== null && typeof level.respawn_time !== 'number')
        ) {
            return {
                isValid: false,
                message: "level, upgrade_price, profit_per_hour, profit_per_hour_increase, price_multiplier, profit_per_hour_multiplier and respawn_time must be a number",
            };
        }

        // validate level values
        if (level.level < 0 || level.price_multiplier < 0 || level.profit_per_hour_multiplier < 0 || level.respawn_time < 0) {
            return {
                isValid: false,
                message: "level, price_multiplier, profit_per_hour_multiplier and respawn_time must be greater or equal to 0",
            };
        }
        if (level.upgrade_price <= 0 || level.profit_per_hour <= 0 || level.profit_per_hour_increase <= 0) {
            return {
                isValid: false,
                message: "upgrade_price, profit_per_hour and profit_per_hour_increase must be greater than 0",
            };
        }

        // validate level order
        if (level.level !== i) {
            return {
                isValid: false,
                message: "level must be in order",
            };
        }
        if (i > 0) {
            if (level.level <= levels[i - 1].level) {
                return {
                    isValid: false,
                    message: "level must be greater than previous level",
                };
            }
            if (i != 1 && (level.upgrade_price <= levels[i - 1].upgrade_price)) {
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
            const today = moment().tz(TIMEZONE);
            let { name, description, image, is_published, category_id, levels, condition, available_duration } = req.body;
            if (!name || !image || !category_id || !levels.length) {
                return res.status(400).json({
                    status: false,
                    message: "Name, image, category_id and levels are required",
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

            // validate condition
            if (condition && condition.card_id && condition.level) {
                if (typeof condition !== 'object') {
                    return res.status(400).json({
                        status: false,
                        message: "Condition must be an object",
                        error: null,
                        data: null,
                    });
                }

                if (!condition.card_id || !condition.level) {
                    return res.status(400).json({
                        status: false,
                        message: "Condition card_id and level are required",
                        error: null,
                        data: null,
                    });
                }

                let card = await prisma.card.findUnique({
                    where: { id: condition.card_id },
                });
                if (!card) {
                    return res.status(404).json({
                        status: false,
                        message: "Condition card not found",
                        error: null,
                        data: null,
                    });
                }

                let cardLevels = JSON.parse(card.levels);
                let levelExists = cardLevels.find((level) => level.level === condition.level);
                if (!levelExists) {
                    return res.status(404).json({
                        status: false,
                        message: "Condition level not found",
                        error: null,
                        data: null,
                    });
                }

                condition = {
                    id: card.id,
                    name: card.name,
                    level: condition.level,
                };
            }

            levels = levels.map((level, index) => ({ ...level, level: index }));

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

            let isPublished = true;
            if (is_published !== undefined && typeof is_published === 'boolean') {
                isPublished = is_published;
            };
            let publishedAtUnix = null;
            if (isPublished) {
                publishedAtUnix = today.unix();
            }

            let now = Math.floor(Date.now() / 1000);
            let card = await prisma.card.create({
                data: {
                    name,
                    description,
                    image,
                    category_id,
                    levels: JSON.stringify(levels),
                    condition: condition ? JSON.stringify(condition) : null,
                    created_at_unix: now,
                    updated_at_unix: now,
                    is_published: isPublished,
                    published_at_unix: publishedAtUnix,
                    available_duration
                },
            });

            card.levels = JSON.parse(card.levels);
            card.condition = JSON.parse(card.condition);
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
            let filter = { where: {}, orderBy: { id: 'asc' } };
            if (req.query.search) {
                filter.where.name = {
                    contains: req.query.search,
                    mode: 'insensitive',
                };
            }
            if (req.query.is_published !== undefined) {
                filter.where.is_published = req.query.is_published === 'true';
            }
            if (req.query.category_id) {
                filter.where.category_id = parseInt(req.query.category_id);
            }

            let cards = await prisma.card.findMany(filter);
            cards = cards.map((card) => {
                delete card.levels;
                delete card.condition;
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
            card.condition = JSON.parse(card.condition);
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
            let { name, description, image, category_id, levels, is_published, condition } = req.body;

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
            if (description) data.description = description;
            if (image) data.image = image;
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
            if (is_published !== undefined) data.is_published = is_published;

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
                levels = levels.map((level, index) => ({ ...level, level: index }));
                data.levels = JSON.stringify(levels);
            }
            if (condition) {
                if (typeof condition !== 'object') {
                    return res.status(400).json({
                        status: false,
                        message: "Condition must be an object",
                        error: null,
                        data: null,
                    });
                }

                if (!condition.card_id || !condition.level) {
                    return res.status(400).json({
                        status: false,
                        message: "Condition card_id and level are required",
                        error: null,
                        data: null,
                    });
                }

                let card = await prisma.card.findUnique({
                    where: { id: condition.card_id },
                });
                if (!card) {
                    return res.status(404).json({
                        status: false,
                        message: "Condition card not found",
                        error: null,
                        data: null,
                    });
                }

                let cardLevels = JSON.parse(card.levels);
                let levelExists = cardLevels.find((level) => level.level === condition.level);
                if (!levelExists) {
                    return res.status(404).json({
                        status: false,
                        message: "Condition level not found",
                        error: null,
                        data: null,
                    });
                }

                condition = {
                    id: card.id,
                    name: card.name,
                    level: condition.level,
                };
                data.condition = JSON.stringify(condition);
            }

            let now = Math.floor(Date.now() / 1000);
            let updatedCard = await prisma.card.update({
                where: { id: parseInt(req.params.id) },
                data: {
                    ...data,
                    updated_at_unix: now
                },
            });

            updatedCard.levels = JSON.parse(updatedCard.levels);
            updatedCard.condition = JSON.parse(updatedCard.condition);
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

    sheet: (req, res, next) => {
        try {
            // Read the Excel data from buffer
            const workbook = XLSX.read(req.file.buffer);

            // Assuming you want to read the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet to JSON
            const data = XLSX.utils.sheet_to_json(worksheet);

            return res.status(200).json({
                status: true,
                message: "Card sheet",
                data: data,
                error: null,
            });
        } catch (error) {
            next(error);
        }
    }
};
