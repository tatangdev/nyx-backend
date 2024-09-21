require('dotenv').config();
require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { BASE_URL = 'http://localhost:3000', ENV = 'test' } = process.env;

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
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

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Welcome to the API Chipmunk Kombat',
        error: null,
        data: null
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
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
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

