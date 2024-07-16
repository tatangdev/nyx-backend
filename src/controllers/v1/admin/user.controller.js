const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    create: async (req, res, next) => {
        try {
            let { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                    status: false,
                    message: "Username and password are required",
                    error: null,
                    data: null
                });
            }

            let user = await prisma.user.findUnique({
                where: {
                    username: username
                }
            });
            if (user) {
                return res.status(409).json({
                    status: false,
                    message: "User already exists",
                    error: null,
                    data: null
                });
            }

            let hashedPassword = bcrypt.hashSync(password, 10);
            let newUser = await prisma.user.create({
                data: {
                    username: username,
                    password: hashedPassword
                }
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
    }
};