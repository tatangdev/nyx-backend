// task controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

module.exports = {
    create: async (req, res, next) => {
        try {
            let { name, image, type, reward_coins, periodicity, config, is_published } = req.body;
            if (!name || !image || !type || !reward_coins || !periodicity) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required fields.",
                    error: null,
                    data: null
                });
            }

            let prefixId = "";
            let newTaskId = "";
            switch (type) {
                case "watch_video":
                    prefixId = "watch_video_";
                    newTaskId = "watch_video_1";
                    type = "WithLink";

                    if (!config.link) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide a link for the task.",
                            error: null,
                            data: null
                        });
                    }
                    break;
                case "follow_social_media":
                    prefixId = "follow_social_media_";
                    newTaskId = "follow_social_media_1";
                    type = "WithLink";

                    if (!config.link) {
                        return res.status(400).json({
                            success: false,
                            message: "Please provide a link for the task.",
                            error: null,
                            data: null
                        });
                    }
                    break;
                default:
                    prefixId = "default_";
                    newTaskId = "default_1";
                    type = "Default";
                    break;
            }

            let latestTask = await prisma.task.findFirst({
                where: {
                    id: {
                        contains: prefixId,
                        mode: 'insensitive',
                    }
                },
                orderBy: {
                    created_at_unix: 'desc'
                }
            });
            if (latestTask) {
                let latestTaskId = latestTask.id;
                let latestTaskIdSplit = latestTaskId.split('_');
                let latestTaskIdNumber = parseInt(latestTaskIdSplit[latestTaskIdSplit.length - 1]);
                newTaskId = prefixId + (latestTaskIdNumber + 1);
            }

            let now = Math.floor(Date.now() / 1000);
            let task = await prisma.task.create({
                data: {
                    id: newTaskId,
                    name,
                    image,
                    type,
                    reward_coins,
                    periodicity,
                    config: JSON.stringify(config),
                    is_published,
                    created_at_unix: now,
                    updated_at_unix: now
                }
            });
            task.config = JSON.parse(task.config);

            res.status(201).json({
                success: true,
                message: "Task created successfully.",
                data: task
            });

        } catch (error) {
            next(error);
        }
    },

    index: async (req, res, next) => {
        try {
            let tasks = await prisma.task.findMany({
                where: {
                    OR: [
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
                    ],
                    is_published: req.query.is_published != null ? req.query.is_published == "true" : undefined
                },
                orderBy: {
                    created_at_unix: 'desc'
                }
            });

            // parse config
            tasks = tasks.map(task => {
                task.config = JSON.parse(task.config);
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
                    id: req.params.id
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

            task.config = JSON.parse(task.config);

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
            let { name, image, type, reward_coins, periodicity, config, is_published } = req.body;
            if (!name || !image || !type || !reward_coins || !periodicity) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required fields.",
                    error: null,
                    data: null
                });
            }

            let task = await prisma.task.update({
                where: {
                    id: req.params.id
                },
                data: {
                    name,
                    image,
                    type,
                    reward_coins,
                    periodicity,
                    config: JSON.stringify(config),
                    is_published,
                    updated_at_unix: Math.floor(Date.now() / 1000)
                }
            });
            task.config = JSON.parse(task.config);

            res.status(200).json({
                success: true,
                message: "Task updated successfully.",
                error: null,
                data: task
            });

        } catch (error) {
            next(error);
        }
    },

    destroy: async (req, res, next) => {
        try {
            let task = await prisma.task.delete({
                where: {
                    id: req.params.id
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
    }
};