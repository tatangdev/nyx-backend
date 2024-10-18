const prisma = require('../../../libs/prisma');
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
            let { telegram_id, ip_address, agent } = req.body;
            if (!telegram_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Telegram ID is required',
                    error: null,
                    data: null
                });
            }

            let player = await prisma.player.findFirst({
                where: { telegram_id }
            });
            if (!player) {
                return res.status(400).json({
                    status: false,
                    message: 'Player not found',
                    error: null,
                    data: null
                });
            }

            console.log(player);

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
    },

    whoami: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const player = await prisma.player.findFirst({ where: { id: playerId } });

            // Fetch player's current earnings
            const playerEarning = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

            const now = moment().tz(TIMEZONE);

            /* handle passive earnings */
            const MAX_PASSIVE_EARNINGS_DURATION = 180 * 60; // 180 minutes in seconds
            const elapsedTime = now.unix() - playerEarning.updated_at_unix;
            const passiveEarningsDuration = Math.min(elapsedTime, MAX_PASSIVE_EARNINGS_DURATION);
            const passiveEarningsPerSecond = playerEarning.passive_per_hour / 3600;
            const earnedPassiveCoins = Math.floor(passiveEarningsDuration * passiveEarningsPerSecond);

            // update total and balance coins
            let totalCoins = playerEarning.coins_total + earnedPassiveCoins;
            let balanceCoins = playerEarning.coins_balance + earnedPassiveCoins;

            /* handle tap earnings */
            let availableTapAmount = Math.min(
                playerEarning.tap_earning_energy_available + elapsedTime * playerEarning.tap_earning_energy_recovery,
                playerEarning.tap_earning_energy
            );

            // Fetch and determine player level
            let levelData = {
                current_level: null,
                level_name: null,
                level_image_url: null,
                level_score: null,
            };
            const levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });

            if (levelConfig) {
                const levels = yaml.load(levelConfig.value);
                const currentLevelScore = totalCoins - balanceCoins;

                const currentLevel = levels.reduce((acc, level) => {
                    return level.minimum_score <= currentLevelScore ? level : acc;
                }, levels[0]);

                levelData.current_level = currentLevel.level;
                levelData.level_name = currentLevel.name;
                levelData.level_image_url = currentLevel.image_url;
                levelData.level_score = currentLevelScore;
            }

            // Construct response
            let referee = null;
            if (player.referee_id) {
                referee = await prisma.player.findFirst({ where: { id: player.referee_id } });
                referee = {
                    id: referee.id,
                    telegram_id: referee.telegram_id,
                    username: referee.username,
                    first_name: referee.first_name,
                    last_name: referee.last_name,
                };
            }
            const response = {
                id: player.id,
                telegram_id: player.telegram_id,
                username: player.username,
                first_name: player.first_name,
                last_name: player.last_name,
                referral_code: player.referral_code,
                referee: referee,
                // ...player,
                passive_earnings: {
                    coins_per_hour: playerEarning.passive_per_hour,
                    coins_per_second: passiveEarningsPerSecond,
                },
                tap_earnings: {
                    coins_per_tap: playerEarning.tap_earning_value,
                    max_taps_allowed: playerEarning.tap_earning_energy,
                    current_taps_available: availableTapAmount,
                    tap_recovery_rate_per_second: playerEarning.tap_earning_energy_recovery,
                },
                level_info: levelData,
                total_earned_coins: totalCoins,
                current_balance: balanceCoins,
            };

            return res.status(200).json({
                status: true,
                message: "Player data retrieved successfully",
                error: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    },

    referrals: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const referralStats = await prisma.$queryRawUnsafe(`
            SELECT
                p.id,
                p.telegram_id,
                p.first_name,
                p.last_name,
                p.level,
                pe.coins_balance AS current_balance,
                pe.coins_total AS total_earned_coins,
                pe.passive_per_hour AS earn_passive_per_hour
            FROM
                players p
            INNER JOIN
                player_earnings pe ON pe.player_id = p.id
            WHERE
                p.referee_id = ${playerId};`);

            let levelConfig = await prisma.config.findFirst({ where: { key: 'level' } });
            let levels = yaml.load(levelConfig.value);

            referralStats.forEach(referral => {
                let referralBonus = 0;
                levels.forEach(level => {
                    if (level.level <= referral.level) {
                        referralBonus += level.level_up_reward;
                    }
                });
                referral.referral_bonus_coins = referralBonus;
            });

            // Reassign the result of the map operation to referralStats
            const updatedReferralStats = referralStats.map(referral => {
                return {
                    id: referral.id,
                    telegram_id: referral.telegram_id,
                    first_name: referral.first_name,
                    last_name: referral.last_name,
                    level: referral.level,
                    current_balance: referral.current_balance,
                    total_earned_coins: referral.total_earned_coins,
                    passive_earnings: {
                        coins_per_hour: referral.earn_passive_per_hour,
                        coins_per_second: referral.earn_passive_per_hour / 3600
                    },
                    referral_bonus_coins: referral.referral_bonus_coins
                };
            });

            return res.status(200).json({
                status: true,
                message: "Referral stats retrieved successfully",
                error: null,
                data: {
                    total_items: updatedReferralStats.length,
                    referrals: updatedReferralStats
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
