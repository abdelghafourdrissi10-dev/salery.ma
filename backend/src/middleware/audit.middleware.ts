import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

/**
 * AUDIT MIDDLEWARE
 * Automatically captures mutations (POST, PATCH, DELETE) and logs them for compliance.
 */
export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  // We only care about mutations for auditing
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Hook into the response finish event to log after the action is completed
  res.on('finish', async () => {
    // Only log successful or client-error attempts (not server crashes)
    if (res.statusCode >= 200 && res.statusCode < 500) {
      const companyId = req.tenantId || req.user?.companyId;
      const userId = req.user?.userId;

      if (!companyId || !userId) return;

      try {
        const action = `${req.method}_${req.baseUrl.split('/').pop()?.toUpperCase()}`;
        const resource = req.baseUrl.split('/').pop() || 'Unknown';
        
        // Scrub sensitive fields from body
        const details = { ...req.body };
        delete details.password;
        delete details.token;

        await prisma.auditLog.create({
          data: {
            companyId,
            userId,
            action,
            resource,
            resourceId: req.params.id || null,
            details: JSON.stringify(details),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (error) {
        console.warn('[AUDIT_LOG_ERROR] Failed to save audit log:', error.message);
      }
    }
  });

  next();
};
