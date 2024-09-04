const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const moment = require('moment-timezone');
const yaml = require('js-yaml');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    index: async (req, res, next) => {
        try {
            const playerId = req.user.id;
            const tasksResult = await prisma.task.findMany({ where: { is_published: true } });
            const now = moment().tz(TIMEZONE);
            let taskSubmissions = await prisma.taskSubmission.findMany({
                where: { player_id: playerId }
            });

            const tasks = await Promise.all(tasksResult.map(async (task) => {
                switch (task.type) {
                    case 'daily_check_in':
                        const remainSeconds = moment(now).endOf('day').diff(now, 'seconds');
                        const dailyStreakRewardValue = yaml.load(task.config);


                        let isCompleted = false;
                        let dayCount = 1;

                        const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });

                        if (attendance) {
                            const lastAttendDate = moment.unix(attendance.last_attendance).tz(TIMEZONE);
                            const daysDiff = moment(now).startOf('day').diff(moment(lastAttendDate).startOf('day'), 'days');

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


                        const todayReward = dailyStreakRewardValue.find(item => item.day === dayCount) || { reward_coins: 0 };

                        return {
                            id: task.id,
                            name: task.name,
                            image: task.image ? task.image + '?tr=h-200' : null,
                            type: task.type,
                            reward_coins: todayReward.reward_coins,
                            requires_admin_approval: task.requires_admin_approval,
                            status: isCompleted ? "completed" : "not_completed",
                            is_completed: isCompleted,
                            completed_at: isCompleted ? attendance.last_attendance : null,
                            rewards_by_day: dailyStreakRewardValue,
                            remain_seconds: remainSeconds,
                            days: dayCount,
                        };
                    default:
                        let response = {
                            id: task.id,
                            name: task.name,
                            image: task.image ? task.image + '?tr=h-200' : null,
                            type: task.type,
                            reward_coins: task.reward_coins,
                            requires_admin_approval: task.requires_admin_approval,
                            status: "not_completed",
                            is_completed: false,
                            completed_at: null,
                            approved_at: null,
                        };

                        let config = yaml.load(task.config);
                        if (config && config.modal_title !== null) response.modal_title = config.modal_title;
                        if (config && config.modal_description !== null) response.modal_description = config.modal_description;
                        if (config && config.modal_link_button !== null) response.modal_link_button = config.modal_link_button;
                        if (config && config.modal_link_url !== null) response.modal_link_url = config.modal_link_url;
                        if (config && config.reward_delay_seconds !== null) response.reward_delay_seconds = config.reward_delay_seconds;

                        let taskSubmission = taskSubmissions.find(item => item.task_id === task.id);
                        if (taskSubmission) {
                            response.completed_at = taskSubmission.submitted_at_unix;
                            response.approved_at = taskSubmission.is_approved ? taskSubmission.completed_at_unix : null;
                            response.status = "completed";
                            response.is_completed = true;
                            if (task.requires_admin_approval && taskSubmission.is_approved == false) {
                                response.is_completed = false;
                                response.status = "rejected";
                            }
                            if (task.requires_admin_approval && taskSubmission.is_approved == null) {
                                response.is_completed = false;
                                response.status = "pending_approval";
                            }
                        }
                        return response;
                }
            }));

            return res.status(200).json({
                status: true,
                message: "OK",
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
            const { task_id: taskId, image } = req.body;
            const todayDate = moment().tz(TIMEZONE);

            let task = await prisma.task.findFirst({ where: { id: taskId } });
            if (!task) {
                return res.status(400).json({
                    status: false,
                    message: `Task with ID '${taskId}' not recognized. Please check the task ID and try again.`,
                    error: "Invalid task ID",
                    data: null
                });
            }
            if (task.requires_admin_approval && !image) {
                return res.status(400).json({
                    status: false,
                    message: "Please upload the required image to submit this task.",
                    error: "Image required",
                    data: null
                });
            }

            let taskSubmitted = await prisma.taskSubmission.findFirst({
                where: {
                    player_id: playerId,
                    task_id: taskId
                }
            });


            switch (task.type) {
                case 'invite_friends':
                    if (taskSubmitted) {
                        return res.status(400).json({
                            status: false,
                            message: "You have already submitted this task.",
                            error: null,
                            data: null
                        });
                    }

                    const referral = yaml.load(task.config);
                    let inviteCount = await prisma.player.findMany({
                        where: {
                            referee_id: playerId
                        }
                    });
                    if (inviteCount.length < referral.referee_count) {
                        return res.status(400).json({
                            status: false,
                            message: `You need to invite ${referral.referee_count} friends to complete this task.`,
                            error: "Invite friends required",
                            data: null
                        });
                    }

                    // Process the reward
                    const point = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });
                    await prisma.playerEarning.update({
                        where: { id: point.id },
                        data: {
                            coins_balance: point.coins_balance + task.reward_coins,
                            coins_total: point.coins_total + task.reward_coins,
                            updated_at_unix: todayDate.unix()
                        }
                    });

                    await prisma.pointHistory.create({
                        data: {
                            player_id: playerId,
                            amount: task.reward_coins,
                            type: 'TASK',
                            data: yaml.dump({
                                nominal: task.reward_coins,
                                previous_balance: point.coins_balance,
                                previous_total: point.coins_total,
                                new_balance: point.coins_balance + task.reward_coins,
                                new_total: point.coins_total + task.reward_coins,
                                note: `Task reward for completing '${task.name}'`
                            }),
                            created_at_unix: todayDate.unix()
                        }
                    });

                    await prisma.taskSubmission.create({
                        data: {
                            player_id: playerId,
                            task_id: taskId,
                            submitted_at_unix: todayDate.unix(),
                            completed_at_unix: task.requires_admin_approval ? null : todayDate.unix(),
                            image: task.requires_admin_approval ? image : null,
                        }
                    });

                    return res.status(200).json({
                        status: true,
                        message: `Congratulations! You have completed the task '${task.name}'.`,
                        error: null,
                        data: null
                    });
                case 'daily_check_in': {
                    const attendance = await prisma.attendance.findFirst({ where: { player_id: playerId } });
                    const attendanceConfigValue = yaml.load(task.config);

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
                                last_attendance: todayDate.unix(),
                                // last_attendance: 1724173199
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
                    const reward = attendanceConfigValue.find(item => item.day === dayCount);
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
                                data: yaml.dump({
                                    nominal: reward.reward_coins,
                                    previous_balance: point.coins_balance,
                                    previous_total: point.coins_total,
                                    new_balance: point.coins_balance + reward.reward_coins,
                                    new_total: point.coins_total + reward.reward_coins,
                                    note: `Daily streak reward for ${dayCount} days`
                                }),
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
                    if (taskSubmitted) {
                        let message = "You have already submitted this task.";
                        if (task.requires_admin_approval && !taskSubmitted.is_approved) {
                            message = "You have already submitted this task. Please wait for the approval.";
                        }
                        return res.status(400).json({
                            status: false,
                            message,
                            error: null,
                            data: null
                        });
                    }

                    if (!task.requires_admin_approval) {
                        // Process the reward
                        const point = await prisma.playerEarning.findFirst({ where: { player_id: playerId } });
                        await prisma.playerEarning.update({
                            where: { id: point.id },
                            data: {
                                coins_balance: point.coins_balance + task.reward_coins,
                                coins_total: point.coins_total + task.reward_coins,
                                updated_at_unix: todayDate.unix()
                            }
                        });

                        await prisma.pointHistory.create({
                            data: {
                                player_id: playerId,
                                amount: task.reward_coins,
                                type: 'TASK',
                                data: yaml.dump({
                                    nominal: task.reward_coins,
                                    previous_balance: point.coins_balance,
                                    previous_total: point.coins_total,
                                    new_balance: point.coins_balance + task.reward_coins,
                                    new_total: point.coins_total + task.reward_coins,
                                    note: `Task reward for completing '${task.name}'`
                                }),
                                created_at_unix: todayDate.unix()
                            }
                        });
                    }

                    await prisma.taskSubmission.create({
                        data: {
                            player_id: playerId,
                            task_id: taskId,
                            submitted_at_unix: todayDate.unix(),
                            completed_at_unix: task.requires_admin_approval ? null : todayDate.unix(),
                            image: task.requires_admin_approval ? image : null,
                        }
                    });

                    return res.status(200).json({
                        status: true,
                        message: `Congratulations! You have completed the task '${task.name}'.`,
                        error: null,
                        data: null
                    });
            }
        } catch (error) {
            next(error);
        }
    }
};