import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // ADMIN has full access everywhere
        if (req.user.role === Role.ADMIN) {
            return next();
        }

        if (!roles.includes(req.user.role as Role)) {
            return res.status(403).json({ error: 'Access Denied: Insufficient Role Permissions' });
        }

        next();
    };
};

export const restrictToSelf = (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const requestedEmail = req.params.email; // assuming routes use email to identify self for employees

    if (userRole === Role.ADMIN || userRole === Role.HR) {
        return next(); // HR and ADMIN can view all
    }

    if (userRole === Role.EMPLOYEE && req.user?.email === requestedEmail) {
        return next(); // Employee can only view their own records (matched by auth email)
    }

    return res.status(403).json({ error: 'Access Denied: Employees can view personal data only' });
};
