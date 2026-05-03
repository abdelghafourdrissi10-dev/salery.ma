import { z } from 'zod';

export const registerSchema = z.object({
    companyName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const refreshSchema = z.object({
    refreshToken: z.string(),
});
