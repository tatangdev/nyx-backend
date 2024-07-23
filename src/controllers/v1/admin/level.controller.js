const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    update: async (req, res, next) => {
        try {
            let { levels } = req.body;
            if (!levels || !Array.isArray(levels) || levels.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: "Levels are required",
                    error: null,
                    data: null
                });
            }

            levels.forEach((l, i) => {
                console.log("level bro:", l);
                if (i == 0 && l.level != 1) {
                    return res.status(400).json({
                        status: false,
                        message: "Level must start from 1",
                        error: null,
                        data: null
                    });
                }
                if (i == 0 && l.minimum_scrore <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum score must be greater than 0",
                        error: null,
                        data: null
                    });
                }

                if (i != 0 && l.level != i + 1) {
                    return res.status(400).json({
                        status: false,
                        message: "Level must be sequential",
                        error: null,
                        data: null
                    });
                }

                if (i == 0 && l.minimum_scrore <= levels[i].minimum_scrore) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum score must be greater than previous level",
                        error: null,
                        data: null
                    });
                }
            });

            let level = await prisma.config.findFirst({ where: { key: 'level' } });
            if (!level) {
                level = await prisma.config.create({
                    data: {
                        key: 'level',
                        value: JSON.stringify(levels)
                    }
                });
            } else {
                level = await prisma.config.update({
                    where: { id: level.id },
                    data: {
                        value: JSON.stringify(levels)
                    }
                });
            }

            return res.status(200).json({
                status: true,
                message: "Levels updated",
                error: null,
                data: levels
            });
        } catch (error) {
            next(error);
        }
    },

    get: async (req, res, next) => {
        try {
            let level = await prisma.config.findFirst({ where: { key: 'level' } });
            if (!level) {
                return res.status(200).json({
                    status: true,
                    message: "Levels not found",
                    error: null,
                    data: []
                });
            }

            return res.status(200).json({
                status: true,
                message: "Levels found",
                error: null,
                data: JSON.parse(level.value)
            });
        } catch (error) {
            next(error);
        }
    }
};