import { z } from 'zod';
import { EmployeeStatus } from '@prisma/client';

export const createEmployeeSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
});

export const updateEmployeeStatusSchema = z.object({
    status: z.nativeEnum(EmployeeStatus),
});
