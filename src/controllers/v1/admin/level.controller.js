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

            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];

                if (i === 0 && level.level !== 1) {
                    return res.status(400).json({
                        status: false,
                        message: "Level must start from 1",
                        error: null,
                        data: null
                    });
                }
                if (level.minimum_score <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum score must be greater than 0",
                        error: null,
                        data: null
                    });
                }
                if (i !== 0 && level.level !== i + 1) {
                    return res.status(400).json({
                        status: false,
                        message: "Level must be sequential",
                        error: null,
                        data: null
                    });
                }
                if (i !== 0 && level.minimum_score <= levels[i - 1].minimum_score) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum score must be greater than the previous level",
                        error: null,
                        data: null
                    });
                }
            }

            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (!levelConfig) {
                levelConfig = await prisma.config.create({
                    data: {
                        key: 'level',
                        value: JSON.stringify(levels)
                    }
                });
            } else {
                levelConfig = await prisma.config.update({
                    where: { id: levelConfig.id },
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
            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (!levelConfig) {
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
                data: JSON.parse(levelConfig.value)
            });
        } catch (error) {
            next(error);
        }
    }
};
