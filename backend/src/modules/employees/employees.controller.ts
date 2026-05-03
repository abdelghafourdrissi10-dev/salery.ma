import { Request, Response, NextFunction } from 'express';
import { EmployeesService } from './employees.service';
import { createEmployeeSchema } from './employees.schema';
import path from 'path';

export class EmployeesController {
    static async uploadPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image file uploaded' });
            }

            // Always use a fixed origin so the URL works across environments
            const photoUrl = `http://127.0.0.1:3001/uploads/photos/${req.file.filename}`;

            const employee = await EmployeesService.updatePhoto(
                req.user?.companyId || 'SYSTEM',
                req.params.id,
                photoUrl
            );

            // Return the full updated employee record so the frontend can update state
            res.json({ ...employee, photoUrl });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createEmployeeSchema.parse(req.body);
            const employee = await EmployeesService.create(req.user!.companyId, data);
            
            // Trigger Event for HR/Admin
            const { eventBus, EVENTS } = await import('../../services/eventBus');
            eventBus.emitEvent(EVENTS.EMPLOYEE.CREATED, {
                companyId: req.user!.companyId,
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`
            });

            res.status(201).json(employee);
        } catch (error) {
            next(error);
        }
    }

    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const employees = await EmployeesService.findAll(req.user!.companyId);
            res.json(employees);
        } catch (error) {
            next(error);
        }
    }

    static async deactivate(req: Request, res: Response, next: NextFunction) {
        try {
            const employee = await EmployeesService.deactivate(req.user!.companyId, req.params.id);
            res.json(employee);
        } catch (error) {
            next(error);
        }
    }

    static async archive(req: Request, res: Response, next: NextFunction) {
        try {
            await EmployeesService.archive(req.user!.userId, req.user!.companyId, req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    static async hardDelete(req: Request, res: Response, next: NextFunction) {
        try {
            await EmployeesService.hardDelete(req.user!.userId, req.user!.companyId, req.params.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message.includes('audit logs')) {
                res.status(400).json({ error: error.message });
                return;
            }
            next(error);
        }
    }
}
