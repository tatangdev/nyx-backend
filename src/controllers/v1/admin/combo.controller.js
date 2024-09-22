const prisma = require('../../../libs/prisma');
const yaml = require('js-yaml');

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    create: async (req, res, next) => {
        try {
            const { date, combination, reward_coins } = req.body;

            // validate date
            if (!Array.isArray(combination) || combination.length !== 4) {
                return res.status(400).json({
                    status: false,
                    message: "Combination must be an array of 4",
                    error: null,
                    data: null
                });
            }
            combination.forEach((cardId, index) => {
                if (!index) return;
                if (combination.indexOf(cardId) !== index) {
                    return res.status(400).json({
                        status: false,
                        message: "Combination must be unique",
                        error: null,
                        data: null
                    });
                }
            });

            // validate reward_coins
            if (typeof reward_coins !== "number" || reward_coins <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Reward coins must be a number and greater than 0",
                    error: null,
                    data: null
                });
            }

            // validate date format
            if (!moment(date, 'YYYY-MM-DD').isValid()) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid date format",
                    error: null,
                    data: null
                });
            }

            // validate date
            let exist = await prisma.cardCombo.findFirst({
                where: {
                    date: date
                }
            });
            if (exist) {
                return res.status(400).json({
                    status: false,
                    message: "Combo already exist",
                    error: null,
                    data: null
                });
            }

            let cards = await prisma.card.findMany({
                where: {
                    id: {
                        in: combination
                    }
                }
            });
            if (cards.length !== 4) {
                return res.status(400).json({
                    status: false,
                    message: "Please provide valid card id",
                    error: null,
                    data: null
                });
            }

            let now = moment().tz(TIMEZONE);
            const combo = await prisma.cardCombo.create({
                data: {
                    date: date,
                    combination: yaml.dump(combination),
                    reward_coins: reward_coins,
                    created_at_unix: now.unix(),
                    updated_at_unix: now.unix()
                }
            });

            combo.combination = yaml.load(combo.combination);
            combo.combination = combo.combination.map(cardId => {
                let card = cards.find(card => card.id === cardId);
                return {
                    id: card.id,
                    name: card.name,
                    description: card.description,
                    image: card.image
                };
            });

            return res.status(200).json({
                status: true,
                message: "OK",
                error: null,
                data: combo
            });
        } catch (error) {
            return next(error);
        }
    },

    index: async (req, res, next) => {
        try {
            const perPage = parseInt(req.query.per_page, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;
            const date = req.query.date;
            const offset = (page - 1) * perPage;

            const combos = await prisma.cardCombo.findMany({
                take: perPage,
                skip: offset,
                orderBy: {
                    date: 'desc'
                },
                where: {
                    date: {
                        contains: date
                    }
                }
            });

            let cards = await prisma.card.findMany();

            const count = await prisma.cardCombo.count({
                where: {
                    date: {
                        contains: date
                    }
                }
            });

            combos.forEach(combo => {
                combo.combination = yaml.load(combo.combination);
                combo.combination = combo.combination.map(cardId => {
                    let card = cards.find(card => card.id === cardId);
                    return {
                        id: card.id,
                        name: card.name,
                        description: card.description,
                        image: card.image
                    };
                });
            });

            return res.status(200).json({
                status: true,
                message: "OK",
                error: null,
                data: {
                    total: count,
                    items: combos
                }
            });
        } catch (error) {
            return next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const combo = await prisma.cardCombo.findUnique({
                where: {
                    id: id
                }
            });

            const cards = await prisma.card.findMany();

            if (!combo) {
                return res.status(404).json({
                    status: false,
                    message: "Combo not found",
                    error: null,
                    data: null
                });
            }

            combo.combination = yaml.load(combo.combination);
            combo.combination = combo.combination.map(cardId => {
                let card = cards.find(card => card.id === cardId);
                return {
                    id: card.id,
                    name: card.name,
                    description: card.description,
                    image: card.image
                };
            });

            return res.status(200).json({
                status: true,
                message: "Combo found",
                error: null,
                data: combo
            });
        } catch (error) {
            return next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const { date, combination, reward_coins } = req.body;

            // validate date
            if (!Array.isArray(combination) || combination.length !== 4) {
                return res.status(400).json({
                    status: false,
                    message: "Combination must be an array of 4",
                    error: null,
                    data: null
                });
            }
            combination.forEach((cardId, index) => {
                if (!index) return;
                if (combination.indexOf(cardId) !== index) {
                    return res.status(400).json({
                        status: false,
                        message: "Combination must be unique",
                        error: null,
                        data: null
                    });
                }
            });

            // validate reward_coins
            if (typeof reward_coins !== "number" || reward_coins <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Reward coins must be a number and greater than 0",
                    error: null,
                    data: null
                });
            }

            // validate date format
            if (!moment(date, 'YYYY-MM-DD').isValid()) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid date format",
                    error: null,
                    data: null
                });
            }

            let now = moment().tz(TIMEZONE);
            const combo = await prisma.cardCombo.update({
                where: {
                    id: id
                },
                data: {
                    date: date,
                    combination: yaml.dump(combination),
                    reward_coins: reward_coins,
                    updated_at_unix: now.unix()
                }
            });

            return res.status(200).json({
                status: true,
                message: "Combo updated",
                error: null,
                data: combo
            });
        } catch (error) {
            return next(error);
        }
    },

    destroy: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const combo = await prisma.cardCombo.findUnique({
                where: {
                    id: id
                }
            });

            if (!combo) {
                return res.status(404).json({
                    status: false,
                    message: "Combo not found",
                    error: null,
                    data: null
                });
            }

            await prisma.cardCombo.delete({
                where: {
                    id: id
                }
            });

            return res.status(200).json({
                status: true,
                message: "Combo deleted",
                error: null,
                data: combo
            });
        } catch (error) {
            return next(error);
        }
    }
};