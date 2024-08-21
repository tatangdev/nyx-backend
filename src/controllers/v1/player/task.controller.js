const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    index: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const tasksResult = await prisma.task.findMany({ where: { is_published: true } });
            // const tasksResult = await prisma.task.findMany({ where: { id: 'daily_streak' } });
            const today = moment().tz(TIMEZONE);

            const tasks = await Promise.all(tasksResult.map(async (task) => {
                switch (task.id) {
                    case 'daily_streak': {
                        const remainSeconds = moment(today).endOf('day').diff(today, 'seconds');
                        console.log("task", task);
                        const dailyStreakRewardValue = JSON.parse(task.config);
                        const totalRewards = dailyStreakRewardValue.reduce((sum, item) => sum + item.reward_coins, 0);

                        let dayCount = 1;
                        let isCompleted = false;

                        const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });
                        console.log("attendance", attendance);

                        if (attendance) {
                            const lastAttendDate = moment.unix(attendance.last_attendance).tz(TIMEZONE);
                            const daysDiff = moment(today).startOf('day').diff(moment(lastAttendDate).startOf('day'), 'days');

                            if (daysDiff < 1) {
                                isCompleted = true;
                                dayCount = attendance.days;
                            } else if (daysDiff > 1) {
                                dayCount = 1;
                            } else {
                                dayCount = attendance.days + 1;
                            }

                            const maxReward = Math.max(...dailyStreakRewardValue.map(item => item.days));
                            if (dayCount > maxReward) {
                                dayCount = attendance.days;
                                isCompleted = true;
                            }
                        }

                        const todayReward = dailyStreakRewardValue.find(item => item.days === dayCount) || { reward_coins: 0 };
                        console.log("dayCount", dayCount);
                        console.log("todayReward", todayReward);

                        return {
                            id: task.id,
                            name: task.name,
                            image: task.image,
                            type: task.type,
                            periodicity: task.periodicity,
                            total_reward_coins: totalRewards,
                            rewards_by_day: dailyStreakRewardValue,
                            reward_coins: todayReward.reward_coins,
                            remain_seconds: remainSeconds,
                            days: dayCount,
                            is_completed: isCompleted,
                        };
                    }
                    default:
                        return {
                            "id": "select_exchange",
                            "type": "Default",
                            "condition": "Custom",
                            "rewardCoins": 5000,
                            "periodicity": "Once",
                            "name": "",
                            "modalLinkButton": "",
                            "image": "",
                            "isCompleted": true,
                            "completedAt": 0
                        };
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
                    const attendanceConfigValue = JSON.parse(attendanceConfig.config);

                    let dayCount = 1;
                    let daysDiff = 1;

                    if (attendance) {
                        const lastAttendDate = moment.unix(attendance.last_attendance).tz(TIMEZONE);
                        daysDiff = moment(todayDate).startOf('day').diff(moment(lastAttendDate).startOf('day'), 'days');

                        if (daysDiff < 1) {
                            return res.status(400).json({
                                status: false,
                                message: "You have already checked in today. Please try again tomorrow.",
                                error: "Daily check-in limit reached",
                                data: null
                            });
                        }

                        dayCount = attendance.days + 1;
                        const maxReward = Math.max(...attendanceConfigValue.map(item => item.days));
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
                                days: dayCount,
                                // last_attendance: todayDate.unix(),
                                last_attendance: 1724173199
                            }
                        });
                    } else {
                        await prisma.attendance.create({
                            data: {
                                player_id: playerId,
                                last_attendance: todayDate.unix(),
                            }
                        });
                    }

                    // Process the reward
                    const reward = attendanceConfigValue.find(item => item.days === dayCount);
                    if (reward) {
                        const point = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });

                        await prisma.playerEarning.update({
                            where: { id: point.id },
                            data: {
                                coins_balance: point.coins_balance + reward.reward_coins,
                                coins_total: point.coins_total + reward.reward_coins,
                                updated_at_unix: todayDate.unix()
                            }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: playerId,
                                amount: reward.reward_coins,
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
                            days: dayCount
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