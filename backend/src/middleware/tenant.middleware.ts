import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * TENANT GUARD — Strict Data Isolation Middleware
 * Ensures every request has a valid companyId context.
 * Effectively converts the system to a "Fail-Closed" multi-tenant architecture.
 */
export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  // Extract companyId from authenticated user (injected by authenticate middleware)
  const companyId = req.user?.companyId;

  if (!companyId) {
    console.error(`[TENANT_GUARD] BLOCKED: Missing companyId for user ${req.user?.userId || 'unknown'}`);
    return res.status(403).json({ 
      error: 'Tenant Access Denied', 
      details: 'A valid company context is required to access these resources.' 
    });
  }

  // Inject into request for easy access in controllers/services
  req.tenantId = companyId;
  next();
};

/**
 * Optional: Higher-level guard to ensure the resource being accessed belongs to the tenant.
 * Used for specific GET/PATCH/DELETE routes where an ID is provided.
 */
export const validateTenantResource = (model: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!id || !tenantId) return next();

    try {
      const resource = await model.findFirst({
        where: { id, companyId: tenantId }
      });

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found in your company context' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
