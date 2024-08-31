const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

const moment = require('moment-timezone');
const { update } = require('./player.controller');
const { destroy } = require('./task.controller');
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
                    combination: JSON.stringify(combination),
                    reward_coins: reward_coins,
                    created_at_unix: now.unix(),
                    updated_at_unix: now.unix()
                }
            });

            combo.combination = JSON.parse(combo.combination);
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
            const limit = parseInt(req.query.limit, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const combos = await prisma.cardCombo.findMany({
                take: limit,
                skip: offset,
                orderBy: {
                    date: 'desc'
                }
            });

            let cards = await prisma.card.findMany();

            const count = await prisma.cardCombo.count();

            combos.forEach(combo => {
                combo.combination = JSON.parse(combo.combination);
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

            combo.combination = JSON.parse(combo.combination);
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
                    combination: JSON.stringify(combination),
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