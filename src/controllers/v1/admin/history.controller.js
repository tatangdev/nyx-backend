const prisma = require('../../../libs/prisma');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    points: async (req, res, next) => {
        try {
            let condition = '';
            if (req.query.player_id) {
                condition += ` AND ph.player_id = ${Number(req.query.player_id)}`;
            }
            if (req.query.type) {
                condition += ` AND ph.type = '${req.query.type}'`;
            }

            let startDate = moment().tz(TIMEZONE).startOf('day');
            let endDate = moment().tz(TIMEZONE).endOf('day');
            if (req.query.start_date) startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day');
            if (req.query.end_date) endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day');
            if (startDate.isAfter(endDate)) {
                return res.status(400).json({
                    status: false,
                    message: 'Start date must be before end date',
                    error: null,
                    data: null
                });
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
                    ph.amount != 0
                    AND ph.created_at_unix >= ${startDate.unix()}
                    AND ph.created_at_unix <= ${endDate.unix()}
                    ${condition}
                ORDER BY 
                    ph.created_at_unix DESC`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    point_histories ph
                INNER JOIN 
                    players p 
                    ON p.id = ph.player_id
                WHERE
                    ph.amount != 0
                    AND ph.created_at_unix >= ${startDate.unix()}
                    AND ph.created_at_unix <= ${endDate.unix()}
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    start_date: startDate.format('YYYY-MM-DD'),
                    end_date: endDate.format('YYYY-MM-DD'),
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
            let condition = '';
            if (req.query.player_id) {
                condition += ` AND peh.player_id = ${Number(req.query.player_id)}`;
            }
            if (req.query.type) {
                condition += ` AND peh.type = '${req.query.type}'`;
            }

            let startDate = moment().tz(TIMEZONE).startOf('day');
            let endDate = moment().tz(TIMEZONE).endOf('day');
            if (req.query.start_date) startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day');
            if (req.query.end_date) endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day');
            if (startDate.isAfter(endDate)) {
                return res.status(400).json({
                    status: false,
                    message: 'Start date must be before end date',
                    error: null,
                    data: null
                });
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
                    peh.amount != 0
                    AND peh.created_at_unix >= ${startDate.unix()}
                    AND peh.created_at_unix <= ${endDate.unix()}
                    ${condition}
                ORDER BY 
                    peh.created_at_unix DESC`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    passive_earning_histories peh
                INNER JOIN 
                    players p 
                    ON p.id = peh.player_id
                WHERE
                    peh.amount != 0
                    AND peh.created_at_unix >= ${startDate.unix()}
                    AND peh.created_at_unix <= ${endDate.unix()}
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    start_date: startDate.format('YYYY-MM-DD'),
                    end_date: endDate.format('YYYY-MM-DD'),
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
            let condition = '';
            if (req.query.player_id) {
                condition += ` AND lh.player_id = ${Number(req.query.player_id)}`;
            }

            let startDate = moment().tz(TIMEZONE).startOf('day');
            let endDate = moment().tz(TIMEZONE).endOf('day');
            if (req.query.start_date) startDate = moment.tz(req.query.start_date, TIMEZONE).startOf('day');
            if (req.query.end_date) endDate = moment.tz(req.query.end_date, TIMEZONE).endOf('day');
            if (startDate.isAfter(endDate)) {
                return res.status(400).json({
                    status: false,
                    message: 'Start date must be before end date',
                    error: null,
                    data: null
                });
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
                    lh.level != 0
                    AND lh.created_at_unix >= ${startDate.unix()}
                    AND lh.created_at_unix <= ${endDate.unix()}
                    ${condition}
                ORDER BY 
                    lh.created_at_unix DESC`);
            // LIMIT ${perPage} OFFSET ${offset};`);

            const countResult = await prisma.$queryRawUnsafe(`
                SELECT 
                    count(*)
                FROM 
                    level_histories lh
                INNER JOIN players p ON p.id = lh.player_id
                WHERE 
                    lh.level != 0
                    AND lh.created_at_unix >= ${startDate.unix()}
                    AND lh.created_at_unix <= ${endDate.unix()}
                    ${condition};`);

            const total = countResult[0].count;

            res.status(200).json({
                status: true,
                message: 'OK',
                error: null,
                data: {
                    start_date: startDate.format('YYYY-MM-DD'),
                    end_date: endDate.format('YYYY-MM-DD'),
                    total: Number(total),
                    items: logs
                }
            });
        } catch (error) {
            next(error);
        }
    }
};