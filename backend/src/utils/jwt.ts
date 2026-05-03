import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
    userId: string;
    companyId: string;
    role: string;
    email?: string;
    portalAccessMode?: string;
}

export const generateAccessToken = (payload: TokenPayload) =>
    jwt.sign(payload, env.JWT_ACCESS_SECRET as string, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });

export const generateRefreshToken = (userId: string) =>
    jwt.sign({ userId }, env.JWT_REFRESH_SECRET as string, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });

export const verifyAccessToken = (token: string) =>
    jwt.verify(token, env.JWT_ACCESS_SECRET as string) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
    jwt.verify(token, env.JWT_REFRESH_SECRET as string) as { userId: string };
