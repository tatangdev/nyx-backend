const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res, next) => {
        try {
            let user = await prisma.user.findUnique({
                where: {
                    username: req.body.username,
                    is_active: true
                }
            });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found",
                    error: null,
                    data: null
                });
            }

            let isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: false,
                    message: "Invalid password",
                    error: null,
                    data: null
                });
            }

            let token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET, {
                expiresIn: '1h'
            });

            return res.status(200).json({
                status: true,
                message: "Login successful",
                error: null,
                data: {
                    token: token
                }
            });
        } catch (error) {
            next(error);
        }
    },

    whoami: async (req, res, next) => {
        try {
            return res.status(200).json({
                status: true,
                message: "User found",
                error: null,
                data: req.user
            });
        } catch (error) {
            next(error);
        }
    }
};