// types/express.d.ts
import { Request } from 'express';

// Define the interface for the user property
interface DecodedToken {
    id: string;
    role: 'admin' | 'player';
    is_superadmin?: boolean;
}

// Extend the Request interface
declare module 'express-serve-static-core' {
    interface Request {
        user?: DecodedToken; // Add `user` property to the Request type
    }
}
