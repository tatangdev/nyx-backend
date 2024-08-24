import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Initialize Prisma Client
const prisma = new PrismaClient({ log: ['query'] });

// Define the interface for the decoded token
interface DecodedToken {
    id: number; // Adjust to match your database schema
    role: 'admin' | 'player';
    is_superadmin?: boolean;
}

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

// Middleware functions
export const validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token = req.headers['authorization'];

        if (!token || !token.startsWith('Bearer ')) {
            res.status(401).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: null,
                data: null
            });
            return;
        }

        token = token.slice(7);

        jwt.verify(token, process.env.JWT_SECRET as string, async (err, decoded) => {
            if (err) {
                res.status(401).json({
                    status: false,
                    message: "Token verification failed",
                    error: err.message,
                    data: null
                });
                return;
            }

            const decodedToken = decoded as DecodedToken;

            if (decodedToken.role === 'player') {
                req.user = decodedToken;
                next();
                return;
            }

            const user = await prisma.user.findUnique({ where: { id: decodedToken.id } });
            if (!user || !user.is_active) {
                res.status(401).json({
                    status: false,
                    message: "User not found or inactive",
                    error: null,
                    data: null
                });
                return;
            }

            const { password, ...userWithoutPassword } = user;
            req.user = { ...userWithoutPassword, role: decodedToken.role };
            next();
        });
    } catch (error) {
        next(error);
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({
            status: false,
            message: "Admin access required",
            error: null,
            data: null
        });
        return;
    }
    next();
};

export const isSuperadmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'admin' || !req.user?.is_superadmin) {
        res.status(403).json({
            status: false,
            message: "Superadmin access required",
            error: null,
            data: null
        });
        return;
    }
    next();
};

export const isPlayer = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'player') {
        res.status(403).json({
            status: false,
            message: "Player access required",
            error: null,
            data: null
        });
        return;
    }
    next();
};
