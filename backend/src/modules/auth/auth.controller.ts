import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { AuthService } from './auth.service';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data = registerSchema.parse(req.body);
            const result = await AuthService.registerCompany(data, req.ip);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data = loginSchema.parse(req.body);
            const userAgent = req.headers['user-agent'];
            const result = await AuthService.login(data, req.ip, userAgent);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Account locked due to too many failed attempts') {
                res.status(403).json({ error: error.message });
                return;
            }
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = refreshSchema.parse(req.body);
            const tokens = await AuthService.refresh(refreshToken);
            res.json(tokens);
        } catch (error) {
            res.status(401).json({ error: 'Invalid or revoked refresh token' });
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            await AuthService.logout(req.user!.userId, refreshToken);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
