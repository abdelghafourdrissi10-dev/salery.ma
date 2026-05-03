import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { checkSubscription } from '../../middleware/subscription.middleware';
import { generatePdf, generateBulkZips, getJobStatus } from './documents.controller';

const router = Router();

// PDF Generation Endpoints (Tenant Locked)
router.get('/generate-pdf', authenticate, tenantGuard, checkSubscription, generatePdf);
router.get('/bulk-zip', authenticate, tenantGuard, checkSubscription, generateBulkZips);
router.get('/jobs/:id', authenticate, getJobStatus);

router.post('/upload', authenticate, tenantGuard, requireRole(['ADMIN', 'HR']), (req, res) => res.json({ message: 'Upload document' }));
router.get('/:employeeId', authenticate, tenantGuard, requireRole(['ADMIN', 'HR', 'EMPLOYEE']), (req, res) => res.json({ message: 'Get employee documents' }));

export const documentsRoutes = router;
