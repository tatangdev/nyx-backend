const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bot = require('../../../libs/telegraf');

const escapeMarkdown = (text) => {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

module.exports = {
    // send: async (req, res, next) => {
    //     try {
    //         let { message, image_url, type, telegram_ids, is_all_players } = req.body;

    //         // validate telegram_ids
    //         if (!is_all_players && (!telegram_ids || !Array.isArray(telegram_ids) || telegram_ids.length === 0)) {
    //             return res.status(400).json({
    //                 status: false,
    //                 message: 'Invalid telegram_ids',
    //                 error: null,
    //                 data: null
    //             });
    //         }

    //         // validate message
    //         if (!message) {
    //             return res.status(400).json({
    //                 status: false,
    //                 message: 'Message is required',
    //                 error: null,
    //                 data: null
    //             });
    //         }

    //         if (is_all_players) {
    //             telegram_ids = await prisma.player.findMany({
    //                 select: {
    //                     telegram_id: true
    //                 }
    //             });
    //             telegram_ids = telegram_ids.map(player => player.telegram_id);
    //         }

    //         let failedMessages = [];
    //         // message = escapeMarkdown(message);
    //         switch (type) {
    //             case 'text':
    //                 for (const chatId of telegram_ids) {
    //                     console.log("chatId", chatId);
    //                     try {
    //                         await bot.telegram.sendMessage(chatId, message, {
    //                             parse_mode: 'Markdown',
    //                             // parse_mode: 'MarkdownV2',
    //                             // reply_markup: inlineButtons
    //                         });
    //                     } catch (err) {
    //                         failedMessages.push(`Failed to send message to ${chatId}: ${err.message}`);
    //                     }
    //                 }
    //                 break;
    //             case 'image':
    //                 if (!image_url) {
    //                     return res.status(400).json({
    //                         status: false,
    //                         message: 'Image url is required',
    //                         error: null,
    //                         data: null
    //                     });
    //                 }
    //                 for (const chatId of telegram_ids) {
    //                     try {
    //                         await bot.telegram.sendPhoto(chatId, image_url, {
    //                             caption: message,
    //                             parse_mode: 'Markdown',
    //                             // parse_mode: 'MarkdownV2',
    //                             // reply_markup: inlineButtons
    //                         });
    //                     } catch (err) {
    //                         failedMessages.push(`Failed to send image to ${chatId}: ${err.message}`);
    //                     }
    //                 }
    //                 break;
    //             default:
    //                 return res.status(400).json({
    //                     status: false,
    //                     message: 'Invalid type',
    //                     error: null,
    //                     data: null
    //                 });
    //         }

    //         if (failedMessages.length > 0) {
    //             return res.status(400).json({
    //                 status: false,
    //                 message: 'Some messages failed to send',
    //                 error: failedMessages,
    //                 data: null
    //             });
    //         }

    //         return res.status(200).json({
    //             status: true,
    //             message: 'Broadcast sent',
    //             error: null,
    //             data: null
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             status: false,
    //             message: 'Internal server error',
    //             error: error.message,
    //             data: null
    //         });
    //     }
    // }

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
                                parse_mode: 'Markdown',
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
                                parse_mode: 'Markdown',
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
