const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bot = require('../../../libs/telegraf');

module.exports = {
    send: async (req, res, next) => {
        try {
            let { message, image_url, type, telegram_ids, is_all_players } = req.body;

            if (!is_all_players && (!telegram_ids || !Array.isArray(telegram_ids) || telegram_ids.length === 0)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid telegram_ids',
                    error: null,
                    data: null
                });
            }

            if (!message) {
                return res.status(400).json({
                    status: false,
                    message: 'Message is required',
                    error: null,
                    data: null
                });
            }

            if (is_all_players) {
                telegram_ids = await prisma.player.findMany({
                    select: {
                        telegram_id: true
                    }
                });
                telegram_ids = telegram_ids
                    .map(player => player.telegram_id)
                    .filter(id => id);
            } else {

                telegram_ids = telegram_ids.filter(id => id);
            }

            res.status(200).json({
                status: true,
                message: 'Broadcast sending process initiated',
                error: null,
                data: null
            });

            switch (type) {
                case 'text':
                    telegram_ids.forEach(async (chatId) => {
                        try {
                            await bot.telegram.sendMessage(chatId, message, {
                                parse_mode: 'MarkdownV2',
                            });
                        } catch (err) {
                            console.error(`Failed to send message to ${chatId}: ${err.message}`);
                        }
                    });
                    break;
                case 'image':
                    if (!image_url) {
                        console.error('Image url is required');
                        return;
                    }
                    telegram_ids.forEach(async (chatId) => {
                        try {
                            await bot.telegram.sendPhoto(chatId, image_url, {
                                caption: message,
                                parse_mode: 'MarkdownV2',
                            });
                        } catch (err) {
                            console.error(`Failed to send image to ${chatId}: ${err.message}`);
                        }
                    });
                    break;
                default:
                    console.error('Invalid type');
                    break;
            }

        } catch (error) {
            console.error('Internal server error:', error.message);
        }
    }
};
