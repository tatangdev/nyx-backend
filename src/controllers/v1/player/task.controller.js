const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');

module.exports = {
    index: async (req, res, next) => {
        try {
            // streak days
            let dailyStreakReward = await prisma.config.findFirst({ where: { key: 'daily_streak_reward' } });
            let dailyStreakRewardValue = JSON.parse(dailyStreakReward.value);

            return res.status(200).json({
                status: true,
                message: "Task data",
                error: null,
                data: {
                    daily_streak_reward: dailyStreakRewardValue
                }
            });
        } catch (error) {
            next(error);
        }
    },

    check: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const { task_id: taskId } = req.body;
            const timezone = process.env.TIMEZONE || 'Asia/Jakarta';
            const todayDate = moment().tz(timezone);

            switch (taskId) {
                case 'daily_streak': {
                    const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });
                    const attendanceConfig = await prisma.config.findFirst({ where: { key: 'daily_streak_reward' } });
                    const attendanceConfigValue = JSON.parse(attendanceConfig.value);

                    let dayCount = 1;
                    let daysDiff = 1;

                    if (attendance) {
                        const lastAttendDate = moment.unix(attendance.updated_at_unix).tz(timezone);
                        daysDiff = moment(todayDate).startOf('day').diff(moment(lastAttendDate).startOf('day'), 'days');

                        if (daysDiff < 1) {
                            return res.status(400).json({
                                status: false,
                                message: "You have already checked in today. Please try again tomorrow.",
                                error: "Daily check-in limit reached",
                                data: null
                            });
                        }

                        dayCount = attendance.day_count + 1;
                        const maxReward = Math.max(...attendanceConfigValue.map(item => item.day_count));
                        if (dayCount > maxReward) {
                            return res.status(400).json({
                                status: false,
                                message: "You have reached the maximum daily streak reward.",
                                error: "Daily check-in limit reached",
                                data: null
                            });
                        }

                        // validate day count
                        dayCount = daysDiff > 1 ? 1 : dayCount;

                        await prisma.attendance.update({
                            where: { id: attendance.id },
                            data: {
                                day_count: dayCount,
                                updated_at_unix: todayDate.unix(),
                                // updated_at_unix: 1724086799
                            }
                        });
                    } else {
                        await prisma.attendance.create({
                            data: {
                                player_id: playerId,
                                created_at_unix: todayDate.unix(),
                                updated_at_unix: todayDate.unix(),
                            }
                        });
                    }

                    // Process the reward
                    const reward = attendanceConfigValue.find(item => item.day_count === dayCount);
                    if (reward) {
                        const point = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

                        await prisma.playerEarning.update({
                            where: { id: point.id },
                            data: {
                                coins_balance: point.coins_balance + reward.reward_amount,
                                coins_total: point.coins_total + reward.reward_amount,
                                updated_at_unix: todayDate.unix()
                            }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: playerId,
                                amount: reward.reward_amount,
                                type: 'DAILY_STREAK',
                                data: JSON.stringify(reward),
                                created_at_unix: todayDate.unix()
                            }
                        });
                    }

                    return res.status(200).json({
                        status: true,
                        message: attendance
                            ? daysDiff > 1
                                ? "Your streak has been reset due to inactivity. Start fresh from today!"
                                : `Great job! Your daily streak is now ${dayCount} days.`
                            : "Welcome! Your daily streak starts today. Keep it going!",
                        error: null,
                        data: {
                            day_count: dayCount
                        }
                    });
                }
                // Future task cases can be added here
                default:
                    return res.status(400).json({
                        status: false,
                        message: `Task with ID '${taskId}' not recognized. Please check the task ID and try again.`,
                        error: "Invalid task ID",
                        data: null
                    });
            }
        } catch (error) {
            next(error);
        }
    }

};