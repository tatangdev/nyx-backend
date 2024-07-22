const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const jwt = require('jsonwebtoken');

module.exports = {
    validate: async (req, res, next) => {
        let token = req.headers['authorization'];

        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
        }

        token = token.slice(7);

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: false,
                    message: "You are not authorized to access this resource",
                    error: err,
                    data: null
                });
            }

            if (decoded.role === 'player') {
                req.user = decoded;
                return next();
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
            req.user = { ...user, role: decoded.role };
            next();
        });
    },

    isAdmin: (req, res, next) => {
        if (req.user.role != 'admin') {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
        }

        next();
    },

    isSuperadmin: (req, res, next) => {
        if (req.user.role != 'admin' || !req.user.is_superadmin) {
            return res.status(403).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
        }

        next();
    },

    isPlayer: (req, res, next) => {
        if (req.user.role != 'player') {
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