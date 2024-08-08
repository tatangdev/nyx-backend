const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bcrypt = require('bcrypt');

module.exports = {
    create: async (req, res, next) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                    status: false,
                    message: "Username and password are required",
                    error: null,
                    data: null
                });
            }

            const user = await prisma.user.findUnique({
                where: { username }
            });
            if (user) {
                return res.status(400).json({
                    status: false,
                    message: "User already exists",
                    error: null,
                    data: null
                });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            const newUser = await prisma.user.create({
                data: { username, password: hashedPassword }
            });

            delete newUser.password;
            return res.status(201).json({
                status: true,
                message: "User created",
                error: null,
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    },

    index: async (req, res, next) => {
        try {
            const filter = { where: {} };

            if (req.query.search) {
                filter.where.username = {
                    contains: req.query.search,
                    mode: 'insensitive'
                };
            }
            if (req.query.is_active) {
                filter.where.is_active = req.query.is_active === 'true';
            }

            let users = await prisma.user.findMany(filter);
            users = users.map(user => {
                delete user.password;
                return user;
            });

            return res.status(200).json({
                status: true,
                message: "Users found",
                error: null,
                data: users
            });
        } catch (error) {
            next(error);
        }
    },

    show: async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(req.params.id) }
            });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found",
                    error: null,
                    data: null
                });
            }

            delete user.password;
            return res.status(200).json({
                status: true,
                message: "User found",
                error: null,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const userId = parseInt(req.params.id);

            if (req.user.id === userId) {
                return res.status(403).json({
                    status: false,
                    message: "You are not authorized to update this resource",
                    error: null,
                    data: null
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found",
                    error: null,
                    data: null
                });
            }

            const { username, password, is_active, is_superadmin } = req.body;
            const data = {};

            if (username) {
                data.username = username;
            }
            if (password) {
                data.password = bcrypt.hashSync(password, 10);
            }
            if (is_active !== undefined) {
                data.is_active = is_active;
            }
            if (is_superadmin !== undefined) {
                data.is_superadmin = is_superadmin;
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data
            });

            delete updatedUser.password;
            return res.status(200).json({
                status: true,
                message: "User updated",
                error: null,
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }
};
