require('dotenv').config();
require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require('express');
const morgan = require('morgan');
const logger = require('./libs/winston.js');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { BASE_URL = 'http://localhost:3000', ENV = 'test' } = process.env;
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

// Middleware
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/docs', express.static('./src/public/docs'));
app.use('/images', express.static('./src/public/images'));
app.use('/videos', express.static('./src/public/videos'));

// Routes
const v1 = require('./routers/v1');
app.use('/api/v1', v1);
if (ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const options = {
        explorer: true,
        swaggerOptions: {
            urls: [
                {
                    url: `${BASE_URL}/docs/swagger_player.yaml`,
                    name: 'Player V1'
                },
                {
                    url: `${BASE_URL}/docs/swagger_admin.yaml`,
                    name: 'Admin V1'
                },
                {
                    url: `${BASE_URL}/docs/swagger_external.yaml`,
                    name: 'External V1'
                }
            ]
        }
    };

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, options));
}

// Middleware to log requests
app.use(morgan('dev'));
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('timestamp', () => moment().tz(TIMEZONE));
app.use(morgan(function (tokens, req, res) {
    return `body: ${tokens.body(req)}\nTimestamp: ${tokens.timestamp()}\n`;
}));

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Welcome to the API Chipmunk Kombat',
        error: null,
        data: null
    });
});

app.get('/logs/errors', (req, res) => {
    const logFilePath = path.join(__dirname, '../logs/error.log');

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read log file' });
        }

        const logs = data.split('\n').filter(log => log).map(log => JSON.parse(log));
        res.render('logs', { logs });
    });
});

// Sentry error handler
Sentry.setupExpressErrorHandler(app);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: `Sorry, can't find the route ${req.originalUrl}`,
        error: null,
        data: null
    });
});

// 500 handler
app.use((err, req, res, next) => {
    if (err.message === 'Insufficient balance') {
        return res.status(400).json({
            status: false,
            message: err.message,
            error: err.errors,
            data: null
        });
    }

    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        endpoint: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params
    });

    console.log(err);

    res.status(500).json({
        status: false,
        message: 'Something broke!',
        error: err.message,
        data: null
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at port`, port);
});

const cron = require('node-cron');
const { approveTasks, resetAttendance } = require('./cron/tasks.js');

cron.schedule('*/10 * * * *', () => {
    approveTasks();
    resetAttendance();
});

cron.schedule('0 11 * * *', () => {
    resetFullEnergyQuota();
});


// telegram bot
const prisma = require('./libs/prisma');
const bot = require('./libs/telegraf.js');

bot.command('connect', async (ctx) => {
    try {
        const telegramId = String(ctx.from.id);
        const player = await prisma.player.findFirst({
            where: { telegram_id: telegramId }
        });

        if (!player) {
            return ctx.reply('🚫 Sorry, you are not registered as a player. Please register to use this feature.');
        }

        if (player.phone_number && /^\+\d{10,15}$/.test(player.phone_number)) {
            return ctx.reply(`🔗 Your phone number is already connected: ${player.phone_number}. No need to connect again.`);
        }

        ctx.reply('📱 Please send your phone number in the format: +1234567890. Note: This can be done only once.');
    } catch (error) {
        console.error('Error handling /connect command:', error);
        ctx.reply('❗ Sorry, something went wrong. Please try again later.');
    }
});

bot.on('message', async (ctx) => {
    try {
        const message = ctx.message.text;
        const telegramId = String(ctx.from.id);
        const player = await prisma.player.findFirst({
            where: { telegram_id: telegramId }
        });

        // Handle phone number input
        if (/^\+\d{10,15}$/.test(message)) {
            if (player.phone_number && /^\+\d{10,15}$/.test(player.phone_number)) {
                return ctx.reply(`🔗 Your phone number is already connected: ${player.phone_number}. No need to connect again.`);
            }

            await prisma.player.update({
                where: { id: player.id },
                data: { phone_number: message }
            });
            ctx.reply(`✅ Your phone number has been connected: ${message}`);
        }
    } catch (error) {
        console.error('Error handling /connect command:', error);
        ctx.reply('❗ Sorry, something went wrong. Please try again later.');
    }
});

bot.launch();

