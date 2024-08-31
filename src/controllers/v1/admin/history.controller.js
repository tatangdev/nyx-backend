const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    points: async (req, res, next) => {
        try {
            const perPage = parseInt(req.query.per_page, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * perPage;

            let condition = 'ph.amount != 0';

            if (req.query.player_id) {
                condition += ` AND ph.player_id = ${Number(req.query.player_id)}`;
            }
            if (req.query.type) {
                condition += ` AND ph.type = '${req.query.type}'`;
            }
            if (req.query.start_date) {
                const startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day').unix();
                condition += ` AND ph.created_at_unix >= ${startDate}`;
            }
            if (req.query.end_date) {
                const endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day').unix();
                condition += ` AND ph.created_at_unix <= ${endDate}`;
            }

            const logs = await prisma.$queryRawUnsafe(`
                SELECT 
                    ph.id, 
                    ph.player_id, 
                    CONCAT(p.first_name, ' ', p.last_name) AS player_name, 
                    ph.amount, 
                    ph.type, 
                    ph.data, 
                    ph.created_at_unix
                FROM 
                    point_histories ph
                INNER JOIN 
                    players p 
                    ON p.id = ph.player_id
                WHERE 
                    ${condition}
                ORDER BY 
                    ph.created_at_unix DESC
                LIMIT ${perPage} OFFSET ${offset};`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    point_histories ph
                INNER JOIN 
                    players p 
                    ON p.id = ph.player_id
                WHERE 
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    total: Number(total),
                    items: logs
                }
            });
        } catch (error) {
            next(error);
        }
    },

    profit: async (req, res, next) => {
        try {
            const perPage = parseInt(req.query.per_page, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * perPage;

            let condition = 'peh.amount != 0';

            if (req.query.player_id) {
                condition += ` AND peh.player_id = ${Number(req.query.player_id)}`;
            }
            if (req.query.type) {
                condition += ` AND peh.type = '${req.query.type}'`;
            }
            if (req.query.start_date) {
                const startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day').unix();
                condition += ` AND peh.created_at_unix >= ${startDate}`;
            }
            if (req.query.end_date) {
                const endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day').unix();
                condition += ` AND peh.created_at_unix <= ${endDate}`;
            }

            const logs = await prisma.$queryRawUnsafe(`
                SELECT 
                    peh.id, 
                    peh.player_id, 
                    CONCAT(p.first_name, ' ', p.last_name) AS player_name, 
                    peh.amount, 
                    peh.type, 
                    peh.data, 
                    peh.created_at_unix
                FROM 
                    passive_earning_histories peh
                INNER JOIN 
                    players p 
                    ON p.id = peh.player_id
                WHERE 
                    ${condition}
                ORDER BY 
                    peh.created_at_unix DESC
                LIMIT ${perPage} OFFSET ${offset};`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    passive_earning_histories peh
                INNER JOIN 
                    players p 
                    ON p.id = peh.player_id
                WHERE 
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    total: Number(total),
                    items: logs
                }
            });
        } catch (error) {
            next(error);
        }
    },

    level: async (req, res, next) => {
        try {
            const perPage = parseInt(req.query.per_page, 10) || 50;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * perPage;

            let condition = 'lh.level != 0';

            if (req.query.player_id) {
                condition += ` AND lh.player_id = ${Number(req.query.player_id)}`;
            }
            if (req.query.start_date) {
                const startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day').unix();
                condition += ` AND lh.created_at_unix >= ${startDate}`;
            }
            if (req.query.end_date) {
                const endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day').unix();
                condition += ` AND lh.created_at_unix <= ${endDate}`;
            }

            const logs = await prisma.$queryRawUnsafe(`
                SELECT 
                    lh.id,
                    lh.player_id,
                    CONCAT(p.first_name, ' ', p.last_name) AS player_name, 
                    lh.level,
                    lh.data,
                    lh.created_at_unix
                FROM 
                    level_histories lh
                INNER JOIN players p ON p.id = lh.player_id
                WHERE 
                    ${condition}
                ORDER BY 
                    lh.created_at_unix DESC
                LIMIT ${perPage} OFFSET ${offset};`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    level_histories lh
                INNER JOIN players p ON p.id = lh.player_id
                WHERE 
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    total: Number(total),
                    items: logs
                }
            });
        } catch (error) {
            next(error);
        }
    }
};