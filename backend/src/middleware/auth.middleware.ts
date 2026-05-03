import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Try cookie first (Secure)
        // 2. Fallback to Authorization header (API compatibility)
        let token = req.cookies?.accessToken;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ error: 'Authentication required', code: 'TOKEN_MISSING' });
        }

        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error: any) {
        console.warn(`[AUTH] Invalid token from ${req.ip}: ${error.message}`);
        res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
    }
};
