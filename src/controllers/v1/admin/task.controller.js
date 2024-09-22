const prisma = require('../../../libs/prisma');
const yaml = require('js-yaml');
const moment = require('moment-timezone');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

module.exports = {
    create: async (req, res, next) => {
        try {
            let errorCnt = 0;
            const now = moment().tz(TIMEZONE);
            const { name, image, reward_coins, type, config, is_published, requires_admin_approval } = req.body;

            // Validate required fields
            if (!name || !image || !reward_coins) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required fields.",
                    error: null,
                    data: null,
                });
            }

            // Validate reward_coins type
            if (isNaN(reward_coins)) {
                return res.status(400).json({
                    success: false,
                    message: "Reward coins must be a number.",
                    error: null,
                    data: null,
                });
            }

            let task = {};

            switch (type) {
                case "invite_friends":
                    if (!config || !config.modal_title || !config.referee_count) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.findFirst({ where: { type: "invite_friends" } });

                    if (task) {
                        return res.status(400).json({
                            success: false,
                            message: "Invite friends task already exists.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.create({
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump({
                                modal_title: config.modal_title,
                                modal_description: config.modal_description || "",
                                referee_count: config.referee_count || 3,
                                reward_delay_seconds: config.reward_delay_seconds || 0,
                            }),
                            is_published: is_published ?? true,
                            requires_admin_approval: requires_admin_approval ?? false,
                            created_at_unix: now.unix(),
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                case "with_link":
                    if (!config || !config.modal_title || !config.modal_link_url) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.create({
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump({
                                modal_title: config.modal_title,
                                modal_description: config.modal_description || "",
                                modal_link_button: config.modal_link_button || "",
                                modal_link_url: config.modal_link_url,
                                reward_delay_seconds: config.reward_delay_seconds || 0,
                            }),
                            is_published: is_published ?? true,
                            requires_admin_approval: requires_admin_approval ?? false,
                            created_at_unix: now.unix(),
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                case "daily_check_in":
                    if (!Array.isArray(config.check_in_data) || !config.check_in_data) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    let latestDay = null;
                    for (let i = 0; i < config.check_in_data.length; i++) {
                        const item = config.check_in_data[i];

                        if (typeof item.day !== "number" || item.day <= 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Day must be a positive number.",
                                error: null,
                                data: null,
                            });
                        }
                        if (typeof item.reward_coins !== "number" || item.reward_coins <= 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Reward coins must be a positive number.",
                                error: null,
                                data: null,
                            });
                        }
                        if (i === 0 && item.day !== 1) {
                            return res.status(400).json({
                                success: false,
                                message: "First day must be 1.",
                                error: null,
                                data: null,
                            });
                        }
                        if (latestDay && item.day !== latestDay.days + 1) {
                            return res.status(400).json({
                                success: false,
                                message: "Days must be a sequence.",
                                error: null,
                                data: null,
                            });
                        }
                        if (latestDay && item.reward_coins <= latestDay.reward_coins) {
                            return res.status(400).json({
                                success: false,
                                message: "Reward coins must be increasing.",
                                error: null,
                                data: null,
                            });
                        }
                        latestDay = { days: item.day, reward_coins: item.reward_coins };
                    }

                    task = await prisma.task.findFirst({ where: { type: "daily_check_in" } });

                    if (task) {
                        return res.status(400).json({
                            success: false,
                            message: "Daily check-in task already exists.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.create({
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump(config.check_in_data.map((item) => ({
                                day: item.day,
                                reward_coins: item.reward_coins,
                            }))),
                            is_published: is_published ?? true,
                            requires_admin_approval: requires_admin_approval ?? false,
                            created_at_unix: now.unix(),
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid task type.",
                        error: null,
                        data: null,
                    });
            }

            // Load task config
            task.config = yaml.load(task.config);

            // Return success response
            return res.status(201).json({
                success: true,
                message: "Task created successfully.",
                data: task,
            });

        } catch (error) {
            next(error);
        }
    },

    index: async (req, res, next) => {
        try {
            const searchConditions = req.query.search
                ? [
                    {
                        id: {
                            contains: req.query.search,
                            mode: 'insensitive',
                        }
                    },
                    {
                        name: {
                            contains: req.query.search,
                            mode: 'insensitive',
                        }
                    }
                ]
                : undefined;

            let tasks = await prisma.task.findMany({
                where: {
                    OR: searchConditions,
                    is_published: req.query.is_published ? req.query.is_published === "true" : undefined
                },
                orderBy: {
                    created_at_unix: 'desc'
                }
            });

            // parse config
            tasks = tasks.map(task => {
                task.config = yaml.load(task.config);
                return task;
            });

            res.status(200).json({
                success: true,
                message: "OK",
                error: null,
                data: tasks
            });

        } catch (error) {
            next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            let task = await prisma.task.findUnique({
                where: {
                    id: Number(req.params.id)
                }
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found.",
                    error: null,
                    data: null
                });
            }

            task.config = yaml.load(task.config);

            res.status(200).json({
                success: true,
                message: "OK",
                error: null,
                data: task
            });

        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            let errorCnt = 0;
            const now = moment().tz(TIMEZONE);
            const { id } = req.params; // Assume the task ID is passed as a URL parameter
            const { name, image, reward_coins, type, config, is_published, requires_admin_approval } = req.body;

            // Validate required fields
            if (!id || !name || !image || !reward_coins) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required fields.",
                    error: null,
                    data: null,
                });
            }

            // Validate reward_coins type
            if (isNaN(reward_coins)) {
                return res.status(400).json({
                    success: false,
                    message: "Reward coins must be a number.",
                    error: null,
                    data: null,
                });
            }

            // Find existing task
            let task = await prisma.task.findUnique({ where: { id: parseInt(id) } });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found.",
                    error: null,
                    data: null,
                });
            }

            // Update based on task type
            switch (type) {
                case "invite_friends":
                    if (!config || !config.modal_title || !config.referee_count) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.update({
                        where: { id: task.id },
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump({
                                modal_title: config.modal_title,
                                modal_description: config.modal_description || "",
                                referee_count: config.referee_count || 3,
                                reward_delay_seconds: config.reward_delay_seconds || 0,
                            }),
                            is_published: is_published ?? task.is_published,
                            requires_admin_approval: requires_admin_approval ?? task.requires_admin_approval,
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                case "with_link":
                    if (!config || !config.modal_title || !config.modal_link_url) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    task = await prisma.task.update({
                        where: { id: task.id },
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump({
                                modal_title: config.modal_title,
                                modal_description: config.modal_description || "",
                                modal_link_button: config.modal_link_button || "",
                                modal_link_url: config.modal_link_url,
                                reward_delay_seconds: config.reward_delay_seconds || 0,
                            }),
                            is_published: is_published ?? task.is_published,
                            requires_admin_approval: requires_admin_approval ?? task.requires_admin_approval,
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                case "daily_check_in":
                    if (!Array.isArray(config.check_in_data) || !config.check_in_data) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide all required fields.",
                            error: null,
                            data: null,
                        });
                    }

                    let latestDay = null;
                    for (let i = 0; i < config.check_in_data.length; i++) {
                        const item = config.check_in_data[i];

                        if (typeof item.day !== "number" || item.day <= 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Day must be a positive number.",
                                error: null,
                                data: null,
                            });
                        }
                        if (typeof item.reward_coins !== "number" || item.reward_coins <= 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Reward coins must be a positive number.",
                                error: null,
                                data: null,
                            });
                        }
                        if (i === 0 && item.day !== 1) {
                            return res.status(400).json({
                                success: false,
                                message: "First day must be 1.",
                                error: null,
                                data: null,
                            });
                        }
                        if (latestDay && item.day !== latestDay.days + 1) {
                            return res.status(400).json({
                                success: false,
                                message: "Days must be a sequence.",
                                error: null,
                                data: null,
                            });
                        }
                        if (latestDay && item.reward_coins <= latestDay.reward_coins) {
                            return res.status(400).json({
                                success: false,
                                message: "Reward coins must be increasing.",
                                error: null,
                                data: null,
                            });
                        }
                        latestDay = { days: item.day, reward_coins: item.reward_coins };
                    }

                    task = await prisma.task.update({
                        where: { id: task.id },
                        data: {
                            name,
                            image,
                            reward_coins,
                            type,
                            config: yaml.dump(config.check_in_data.map((item) => ({
                                day: item.day,
                                reward_coins: item.reward_coins,
                            }))),
                            is_published: is_published ?? task.is_published,
                            requires_admin_approval: requires_admin_approval ?? task.requires_admin_approval,
                            updated_at_unix: now.unix(),
                        },
                    });
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid task type.",
                        error: null,
                        data: null,
                    });
            }

            // Load task config
            task.config = yaml.load(task.config);

            // Return success response
            return res.status(200).json({
                success: true,
                message: "Task updated successfully.",
                data: task,
            });

        } catch (error) {
            next(error);
        }
    },

    destroy: async (req, res, next) => {
        try {
            let task = await prisma.task.delete({
                where: {
                    id: Number(req.params.id)
                }
            });

            res.status(200).json({
                success: true,
                message: "Task deleted successfully.",
                error: null,
                data: task
            });

        } catch (error) {
            next(error);
        }
    },

    submissions: async (req, res, next) => {
        try {
            let query = `SELECT
                ts.id,
                ts.player_id,
                CONCAT(p.first_name, p.last_name) AS player_name,
                ts.submitted_at_unix,
                ts.is_approved,
                u.id AS approved_by_admin_id,
                CASE
                    WHEN ts.approval_by = -1 THEN 'System'
                    ELSE u.username
                END AS approved_by_admin_username,
                t.id AS task_id,
                t.name AS task_name,
                ts.image
            FROM
                task_submissions ts
                INNER JOIN tasks t ON t.id = ts.task_id
                INNER JOIN players p ON p.id = ts.player_id
                LEFT JOIN users u ON u.id = ts.approval_by
            WHERE t.requires_admin_approval AND is_approved IS NULL`;

            if (req.query.task_id) query += ` AND t.id = ${req.query.task_id}`;
            if (req.query.player_id) query += ` AND ts.player_id = ${req.query.player_id}`;
            if (req.query.is_approved) query += ` AND ts.is_approved = ${req.query.is_approved === "true"}`;
            if (req.query.start_date) {
                let startUnix = moment.tz(req.query.start_date, TIMEZONE).startOf('day').unix();
                query += ` AND ts.submitted_at_unix >= ${startUnix}`;
            }
            if (req.query.end_date) {
                let endUnix = moment.tz(req.query.end_date, TIMEZONE).endOf('day').unix();
                query += ` AND ts.submitted_at_unix <= ${endUnix}`;
            }

            let submissions = await prisma.$queryRawUnsafe(query);

            return res.status(200).json({
                success: true,
                message: "OK",
                error: null,
                data: submissions
            });
        } catch (error) {
            next(error);
        }
    },

    approval: async (req, res, next) => {
        try {
            let todayDate = moment().tz(TIMEZONE);
            let submission = await prisma.taskSubmission.findFirst({
                where: {
                    id: Number(req.params.id)
                }
            });
            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: "Submission not found.",
                    error: null,
                    data: null
                });
            }
            if (submission.is_approved !== null) {
                return res.status(400).json({
                    success: false,
                    message: "Submission already approved/rejected.",
                    error: null,
                    data: null
                });
            }

            let task = await prisma.task.findFirst({
                where: {
                    id: submission.task_id
                }
            });

            // check if req.body.is_approved is boolean
            if (req.body.is_approved === undefined || typeof req.body.is_approved !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid is_approved value.",
                    error: null,
                    data: null
                });
            }

            await prisma.$transaction(async (prisma) => {

                if (req.body.is_approved) {
                    const point = await prisma.playerEarning.findFirst({ where: { player_id: submission.player_id } });
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
                            player_id: submission.player_id,
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

                submission = await prisma.taskSubmission.update({
                    where: { id: submission.id },
                    data: {
                        is_approved: req.body.is_approved,
                        approval_by: req.user.id,
                        completed_at_unix: todayDate.unix()
                    }
                });
            });

            return res.status(200).json({
                success: true,
                message: "Submission approved/rejected successfully.",
                data: submission
            });
        } catch (error) {
            next(error);
        }
    },
};