const prisma = require('../../../libs/prisma');
const bot = require('../../../libs/telegraf');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';
const MESSAGES_PER_BATCH = parseInt(process.env.MESSAGE_PER_BATCH, 10) || 10;

// Utility function to introduce delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendBroadcastMessage = async (broadcastMessageId) => {
    try {
        const broadcastMessage = await prisma.broadcastMessage.findUnique({
            where: {
                id: broadcastMessageId
            }
        });

        if (!broadcastMessage) {
            console.error('Broadcast message not found');
            return;
        }

        const recipients = await prisma.broadcastMessageMapping.findMany({
            select: {
                id: true,
                telegram_id: true,
                is_failed: true
            },
            where: {
                message_id: broadcastMessageId,
                is_sent: false,
                is_failed: false
            }
        });

        const totalRecipients = recipients.length;
        for (let i = 0; i < totalRecipients; i += MESSAGES_PER_BATCH) {
            const batch = recipients.slice(i, i + MESSAGES_PER_BATCH);

            for (const recipient of batch) {
                try {
                    switch (broadcastMessage.type) {
                        case 'text':
                            await bot.telegram.sendMessage(recipient.telegram_id, broadcastMessage.message, {
                                parse_mode: 'MarkdownV2',
                            });
                            break;
                        case 'image':
                            await bot.telegram.sendPhoto(recipient.telegram_id, broadcastMessage.image_url, {
                                caption: broadcastMessage.message,
                                parse_mode: 'MarkdownV2',
                            });
                            break;
                        default:
                            console.error('Invalid message type');
                            break;
                    }

                    await prisma.broadcastMessageMapping.update({
                        where: { id: recipient.id },
                        data: { is_sent: true, updated_at_unix: moment().unix() }
                    });
                } catch (error) {
                    console.error(`Failed to send ${broadcastMessage.type} to ${recipient.telegram_id}: ${error.message}`);

                    if (error.code === 400) {
                        const errorMessage = error.description || 'chat not found';
                        await prisma.broadcastMessageMapping.update({
                            where: { id: recipient.id },
                            data: { is_sent: true, is_failed: true, updated_at_unix: moment().unix(), error_message: errorMessage }
                        });
                    }

                    else if (error.code === 429) {
                        const retryAfterSeconds = error.parameters.retry_after || 60;
                        console.error(`Rate limit reached. Retrying after ${retryAfterSeconds} seconds.`);
                        await delay(retryAfterSeconds * 1000);
                    }
                }
            }

            await delay(1000);
        }
    } catch (error) {
        console.error('Failed to send broadcast messages:', error.message);
    }
};

module.exports = {
    send: async (req, res, next) => {
        const now = moment().tz(TIMEZONE);
        try {
            const { message, image_url, type, telegram_ids, is_all_players } = req.body;

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
                    message: 'Message content is required',
                    error: null,
                    data: null
                });
            }

            if (type === 'image' && !image_url) {
                return res.status(400).json({
                    status: false,
                    message: 'Image URL is required for image type messages',
                    error: null,
                    data: null
                });
            }

            let newBroadcastMessage;
            await prisma.$transaction(async (prisma) => {
                const recipientFilter = {};
                if (!is_all_players) {
                    recipientFilter.telegram_id = {
                        in: telegram_ids
                    };
                }

                const recipients = await prisma.player.findMany({
                    select: {
                        id: true,
                        telegram_id: true
                    },
                    where: recipientFilter
                });

                newBroadcastMessage = await prisma.broadcastMessage.create({
                    data: {
                        type: type,
                        message: message,
                        image_url: type === 'image' ? image_url : null,
                        created_at_unix: now.unix()
                    }
                });

                const messageMappings = recipients.map(recipient => ({
                    message_id: newBroadcastMessage.id,
                    telegram_id: recipient.telegram_id,
                    created_at_unix: now.unix(),
                    updated_at_unix: now.unix()
                }));

                await prisma.broadcastMessageMapping.createMany({
                    data: messageMappings
                });
            });

            res.status(200).json({
                status: true,
                message: 'Broadcast sending process initiated',
                error: null,
                data: null
            });

            sendBroadcastMessage(newBroadcastMessage.id);
        } catch (error) {
            next(error);
        }
    }
};
