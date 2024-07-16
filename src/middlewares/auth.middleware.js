const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const jwt = require('jsonwebtoken');

module.exports = {
    validate: (req, res, next) => {
        let token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: false,
                    message: "You are not authorized to access this resource",
                    error: err,
                    data: null
                });
            }

            let user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user || !user.is_active) {
                return res.status(401).json({
                    status: false,
                    message: "You are not authorized to access this resource",
                    error: null,
                    data: null
                });
            }

            delete user.password;
            req.user = user;
            next();
        });
    },

    isAdmin: (req, res, next) => {
        if (!req.user.is_superadmin) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
        }

        next();
    }
};