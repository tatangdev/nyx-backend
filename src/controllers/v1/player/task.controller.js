const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    index: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const tasksResult = await prisma.task.findMany({ where: { id: 'daily_streak' } });
            const today = moment().tz(TIMEZONE);

            const tasks = await Promise.all(tasksResult.map(async (task) => {
                switch (task.id) {
                    case 'daily_streak': {
                        const remainSeconds = moment(today).endOf('day').diff(today, 'seconds');
                        const dailyStreakRewardValue = JSON.parse(task.data);
                        const totalRewards = dailyStreakRewardValue.reduce((sum, item) => sum + item.reward_amount, 0);

                        let dayCount = 1;
                        let isCompleted = false;

                        const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });

                        if (attendance) {
                            const lastAttendDate = moment.unix(attendance.updated_at_unix).tz(TIMEZONE);
                            const daysDiff = moment(today).startOf('day').diff(moment(lastAttendDate).startOf('day'), 'days');

                            if (daysDiff < 1) {
                                isCompleted = true;
                                dayCount = attendance.day_count;
                            } else if (daysDiff > 1) {
                                dayCount = 1;
                            } else {
                                dayCount = attendance.day_count + 1;
                            }

                            const maxReward = Math.max(...dailyStreakRewardValue.map(item => item.day_count));
                            if (dayCount > maxReward) {
                                dayCount = attendance.day_count;
                                isCompleted = true;
                            }
                        }

                        const todayReward = dailyStreakRewardValue.find(item => item.day_count === dayCount) || { reward_amount: 0 };

                        return {
                            id: task.id,
                            name: task.name,
                            description: task.description,
                            total_rewards: totalRewards,
                            rewards_by_day: dailyStreakRewardValue,
                            reward_coins: todayReward.reward_amount,
                            remain_seconds: remainSeconds,
                            days: dayCount,
                            is_completed: isCompleted,
                        };
                    }
                    // Future task cases can be added here
                }
            }));

            return res.status(200).json({
                status: true,
                message: "Task data retrieved successfully.",
                error: null,
                data: tasks.filter(task => task !== undefined)
            });
        } catch (error) {
            next(error);
        }
    },

    check: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const { task_id: taskId } = req.body;
            const todayDate = moment().tz(TIMEZONE);

            switch (taskId) {
                case 'daily_streak': {
                    const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });
                    const attendanceConfig = await prisma.task.findFirst({ where: { id: 'daily_streak' } });
                    const attendanceConfigValue = JSON.parse(attendanceConfig.data);

                    let dayCount = 1;
                    let daysDiff = 1;

                    if (attendance) {
                        const lastAttendDate = moment.unix(attendance.updated_at_unix).tz(TIMEZONE);
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
                                // updated_at_unix: todayDate.unix(),
                                updated_at_unix: 1724173199
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