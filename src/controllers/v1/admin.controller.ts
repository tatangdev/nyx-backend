import { PrismaClient, User } from '@prisma/client'; // Assuming User is a type in your Prisma schema
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient({ log: ['query'] });

// interface AuthRequest extends Request {
//     user?: User; // Define the type of the user explicitly
// }

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                username: username,
                is_active: true
            }
        });

        if (!user) {
            res.status(404).json({
                status: false,
                message: "User not found",
                error: null,
                data: null
            });
            return;
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                status: false,
                message: "Invalid password",
                error: null,
                data: null
            });
            return;
        }

        const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET as string);

        res.status(200).json({
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
};

// export const whoami = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         if (!req.user) {
//             res.status(404).json({
//                 status: false,
//                 message: "User not found",
//                 error: null,
//                 data: null
//             });
//             return;
//         }

//         res.status(200).json({
//             status: true,
//             message: "User found",
//             error: null,
//             data: req.user
//         });
//     } catch (error) {
//         next(error);
//     }
// };
