const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';
const bot = require('../../../libs/telegraf');

function generateOtp(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    let otp = Math.floor(Math.random() * (max - min + 1)) + min;

    return otp.toString().padStart(length, '0');
}

module.exports = {
    login: async (req, res, next) => {
        const now = moment().tz(TIMEZONE);
        try {
            let { phone_number, ip_address, agent } = req.body;
            if (!phone_number) {
                return res.status(400).json({
                    status: false,
                    message: 'Phone number is required',
                    error: null,
                    data: null
                });
            }

            let player = await prisma.player.findFirst({
                where: {
                    phone_number: {
                        contains: phone_number
                    }
                }
            });
            if (!player) {
                return res.status(400).json({
                    status: false,
                    message: 'Player not found',
                    error: null,
                    data: null
                });
            }

            let otpCode = generateOtp();

            let existingOtp = await prisma.otp.findFirst({
                where: {
                    player_id: player.id,
                    is_verified: false
                }
            });
            if (existingOtp) {
                await prisma.otp.update({
                    where: {
                        id: existingOtp.id
                    },
                    data: {
                        otp: otpCode,
                        ip_address,
                        agent,
                        expired_at_unix: now.add(5, 'minutes').unix(),
                    }
                });
            } else {
                await prisma.otp.create({
                    data: {
                        player_id: player.id,
                        otp: otpCode,
                        ip_address,
                        agent,
                        expired_at_unix: now.add(5, 'minutes').unix(),
                        created_at_unix: now.unix(),
                    }
                });
            }

            let message = `🔐 <b>Your OTP Code</b>\n\n<b>${otpCode}</b>\n\nThis OTP is valid for <b>5 minutes</b> ⏳ and can be used to <b>login</b> to the website 🌐.\n\nIf you didn't request this code, please ignore this message.`;
            bot.telegram.sendMessage(player.telegram_id, message, { parse_mode: 'HTML' });

            return res.status(200).json({
                status: true,
                message: 'Login successful',
                error: null,
                data: {
                    telegram_id: player.telegram_id,
                }
            });
        } catch (error) {
            next(error);
        }
    },

    verifyOTP: async (req, res, next) => {
        const now = moment().tz(TIMEZONE);
        try {
            let { telegram_id, otp } = req.body;
            if (!telegram_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Telegram ID is required',
                    error: null,
                    data: null
                });
            }
            if (!otp) {
                return res.status(400).json({
                    status: false,
                    message: 'OTP is required',
                    error: null,
                    data: null
                });
            }

            let player = await prisma.player.findUnique({
                where: {
                    telegram_id
                }
            });
            if (!player) {
                return res.status(400).json({
                    status: false,
                    message: 'Player not found',
                    error: null,
                    data: null
                });
            }

            let otpData = await prisma.otp.findFirst({
                where: {
                    player_id: player.id,
                    is_verified: false
                }
            });
            if (!otpData) {
                return res.status(400).json({
                    status: false,
                    message: 'OTP not found',
                    error: null,
                    data: null
                });
            }

            if (otpData.is_verified) {
                return res.status(400).json({
                    status: false,
                    message: 'OTP is already verified',
                    error: null,
                    data: null
                });
            }

            if (otpData.otp !== otp) {
                return res.status(400).json({
                    status: false,
                    message: 'OTP is invalid',
                    error: null,
                    data: null
                });
            }

            if (otpData.expired_at_unix < now.unix()) {
                return res.status(400).json({
                    status: false,
                    message: 'OTP is expired',
                    error: null,
                    data: null
                });
            }

            const token = jwt.sign({ ...player, role: 'player' }, process.env.JWT_SECRET);
            await prisma.otp.update({
                where: {
                    id: otpData.id
                },
                data: {
                    is_verified: true
                }
            });

            return res.status(200).json({
                status: true,
                message: 'OTP verified',
                error: null,
                data: {
                    token
                }
            });


        } catch (error) {
            next(error);
        }
    }
};
