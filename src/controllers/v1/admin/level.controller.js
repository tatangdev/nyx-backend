const prisma = require('../../../libs/prisma');
const yaml = require('js-yaml');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

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
                let level = levels[i];

                if (i === 0 && level.level !== 1) {
                    return res.status(400).json({
                        status: false,
                        message: "Level must start from 1",
                        error: null,
                        data: null
                    });
                }
                if (i != 0 && level.minimum_score <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum score must be greater than 0",
                        error: null,
                        data: null
                    });
                }
                if (level.level_up_reward <= 0) {
                    return res.status(400).json({
                        status: false,
                        message: "Levelling bonus must be greater than 0",
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
                if (i !== 0 && level.level_up_reward <= levels[i - 1].level_up_reward) {
                    return res.status(400).json({
                        status: false,
                        message: "Levelling bonus must be greater than the previous level",
                        error: null,
                        data: null
                    });
                }
                if (level.name === null || level.name === "") {
                    return res.status(400).json({
                        status: false,
                        message: "Level name must not be empty",
                        error: null,
                        data: null
                    });
                }
                if (level.image_url === null || level.image_url === "") {
                    return res.status(400).json({
                        status: false,
                        message: "Level image_url must not be empty",
                        error: null,
                        data: null
                    });
                }
            }

            const now = moment().tz(TIMEZONE);
            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (!levelConfig) {
                levelConfig = await prisma.config.create({
                    data: {
                        key: 'level',
                        value: yaml.dump(levels),
                        created_at_unix: now.unix(),
                        updated_at_unix: now.unix(),
                    }
                });
            } else {
                levelConfig = await prisma.config.update({
                    where: { id: levelConfig.id },
                    data: {
                        value: yaml.dump(levels),
                        updated_at_unix: now.unix()
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
                data: yaml.load(levelConfig.value)
            });
        } catch (error) {
            next(error);
        }
    }
};
