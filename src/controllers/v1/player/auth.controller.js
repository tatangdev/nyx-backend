const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res, next) => {
        try {
            let { telegram_id, username, first_name, last_name } = req.body;

            let player = await prisma.player.upsert({
                where: { telegram_id },
                update: { username, first_name, last_name },
                create: {
                    telegram_id,
                    username,
                    first_name,
                    last_name,
                    created_at: Math.floor(Date.now() / 1000)
                }
            });

            let defaultAmount = parseInt(process.env.DEFAULT_POINT_AMOUNT) || 0;
            let defaultProfitPerHour = parseInt(process.env.DEFAULT_PROFIT_PER_HOUR) || 0;

            let point = await prisma.point.findFirst({ where: { player_id: player.id } });
            if (!point) {
                await prisma.point.create({
                    data: {
                        player_id: player.id,
                        amount: defaultAmount,
                        profit_per_hour: defaultProfitPerHour
                    }
                });
            }

            let token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET, { expiresIn: '1d' });

            return res.status(200).json({
                status: true,
                message: "Player logged in",
                error: null,
                data: { token }
            });
        } catch (error) {
            next(error);
        }
    },

    whoami: async (req, res, next) => {
        try {
            let user = { ...req.user };

            let point = await prisma.point.findFirst({ where: { player_id: req.user.id } });
            if (point) {
                user.point = point.amount;
                user.profit_per_hour = point.profit_per_hour;
            }

            return res.status(200).json({
                status: true,
                message: "Player details",
                error: null,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    home: async (req, res, next) => {
        try {
            let response = {
                point: 0,
                profit_per_hour: 0,
                level: {
                    current_level: 0,
                    current_level_score: 0,
                    next_level: 0,
                    next_level_score: 0,
                    next_level_percentage: 0
                }
            };

            let point = await prisma.point.findFirst({ where: { player_id: req.user.id } });
            if (point) {
                response.point = point.amount;
                response.profit_per_hour = point.profit_per_hour;
                response.level.current_level_score = point.spend_amount;
            }

            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            if (levelConfig) {
                let levels = JSON.parse(levelConfig.value);

                // Find the highest level where minimum_score is less than or equal to current_level_score
                let currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= response.level.current_level_score ? level : acc;
                }, levels[0]);

                // Find the next level if it exists
                let nextLevel = levels.find(level => level.level === currentLevel.level + 1);

                response.level.current_level = currentLevel.level;
                response.points_per_click = currentLevel.level;
                if (nextLevel) {
                    response.level.next_level = nextLevel.level;
                    response.level.next_level_score = nextLevel.minimum_score;
                    response.level.next_level_percentage = Math.floor((response.level.current_level_score / nextLevel.minimum_score) * 100);
                } else {
                    response.level.next_level = null;
                    response.level.next_level_score = null;
                    response.level.next_level_percentage = null;
                }
            }

            return res.status(200).json({
                status: true,
                message: "Player details",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    }
};