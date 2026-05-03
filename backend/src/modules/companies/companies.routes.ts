import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', requireRole([Role.ADMIN]), (req, res) => res.json({ message: 'List Companies' }));
router.get('/:id', requireRole([Role.ADMIN]), (req, res) => res.json({ message: 'Get Company details' }));

export const companiesRoutes = router;
