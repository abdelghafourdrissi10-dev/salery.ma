import { Router } from 'express';
import { requireRole, restrictToSelf } from '../../middleware/rbac.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard, validateTenantResource } from '../../middleware/tenant.middleware';
import { validate, employeeCreateSchema, employeePatchSchema } from '../../middleware/security.middleware';
import { prisma } from '../../prisma';
import { uploadDocuments, uploadPhoto as uploadPhotoMiddleware, buildFileUrl } from '../../services/storageAdapter';
import { EmployeesController } from './employees.controller';
import path from 'path';


// ── Role enum from Prisma must be referenced safely ──────────────────────────
const Role = { ADMIN: 'ADMIN', HR: 'HR', EMPLOYEE: 'EMPLOYEE' } as const;

const router = Router();

// ─── GET All Employees (Tenant Locked) ───────────────────────────────────────
router.get('/', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const employees = await prisma.employee.findMany({
            where: { companyId }, // FAIL-CLOSED: companyId is mandatory
            orderBy: { createdAt: 'desc' }
        });

        const mappedEmps = employees.map(e => ({
            ...e,
            fullName: `${e.firstName} ${e.lastName}`,
            employmentStatus: 'active',
            civility: 'MR',
            cin: e.badgeId || `CIN-${e.id.substring(0, 6)}`,
            internalMatricule: e.id.substring(0, 8).toUpperCase(),
            jobTitle: e.position,
            department: 'General',
            contractType: 'CDI',
            country: 'MA',
            salaryType: e.salaryType === 'HOURLY' ? 'hourly' : 'fixed',
            hireDate: e.hireDate ? e.hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        }));

        res.json(mappedEmps);
    } catch (e) { next(e); }
});

// ─── GET Employee by Email ────────────────────────────────────────────────────
router.get('/:email', requireRole([Role.ADMIN, Role.HR, Role.EMPLOYEE]), restrictToSelf, async (req, res, next) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { email: req.params.email }
        });
        res.json(employee);
    } catch (e) { next(e); }
});

// ─── POST Create Employee ─────────────────────────────────────────────────────
router.post('/', authenticate, tenantGuard, validate(employeeCreateSchema), async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { firstName, lastName, phone, email, position, salaryType, baseSalary } = req.body;

        const newEmp = await prisma.employee.create({
            data: {
                firstName: firstName || 'Inconnu',
                lastName: lastName || 'Nom',
                phone: phone || '',
                email: email || '',
                position: position || 'Employé',
                salaryType: salaryType || 'MONTHLY',
                baseSalary: Number(baseSalary) || 0,
                companyId: companyId
            }
        });

        // Record timeline event (non-blocking)
        prisma.employeeEvent.create({
            data: {
                employeeId: newEmp.id,
                type: 'EMPLOYEE_CREATED',
                title: 'Profil Employé Créé',
                description: `Création du profil salarié — ${position || 'Employé'}`,
                metadata: { position, salaryType, baseSalary }
            }
        }).catch(console.error);

        res.status(201).json(newEmp);
    } catch (e) { next(e); }
});

// ─── PATCH Update Employee ────────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, email, position, baseSalary, salaryType, 
                cin, socialSecurityNumber, emergencyContact, maritalStatus, nationality, 
                dateOfBirth, placeOfBirth, address, city, country, bankName, rib,
                contractType, hireDate, contractEndDate } = req.body;

        const existing = await prisma.employee.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Employee not found' });

        // Calculate a basic completion score
        const requiredFields = [firstName, lastName, phone, email, position, baseSalary, cin, socialSecurityNumber, address, rib, contractType, hireDate];
        const score = Math.round((requiredFields.filter(Boolean).length / requiredFields.length) * 100);

        const updated = await prisma.employee.update({
            where: { id },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(position && { position }),
                ...(baseSalary !== undefined && { baseSalary: Number(baseSalary) }),
                ...(salaryType && { salaryType: salaryType.toUpperCase() as any }),
                ...(cin !== undefined && { cin }),
                ...(socialSecurityNumber !== undefined && { socialSecurityNumber }),
                ...(emergencyContact !== undefined && { emergencyContact }),
                ...(maritalStatus !== undefined && { maritalStatus }),
                ...(nationality !== undefined && { nationality }),
                ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
                ...(placeOfBirth !== undefined && { placeOfBirth }),
                ...(address !== undefined && { address }),
                ...(city !== undefined && { city }),
                ...(country !== undefined && { country }),
                ...(bankName !== undefined && { bankName }),
                ...(rib !== undefined && { rib }),
                ...(contractType !== undefined && { contractType }),
                ...(hireDate !== undefined && { hireDate: hireDate ? new Date(hireDate) : undefined }),
                ...(contractEndDate !== undefined && { contractEndDate: contractEndDate ? new Date(contractEndDate) : null }),
                profileCompletionScore: score
            }
        });

        // Intelligence: Salary or Position Change Event
        if ((baseSalary !== undefined && Number(baseSalary) !== existing.baseSalary) || (position && position !== existing.position)) {
            const { eventBus, EVENTS } = await import('../../services/eventBus');
            eventBus.emitEvent(EVENTS.EMPLOYEE.UPDATED, {
                companyId: updated.companyId,
                employeeId: updated.id,
                employeeName: `${updated.firstName} ${updated.lastName}`,
                oldSalary: existing.baseSalary,
                newSalary: updated.baseSalary,
                oldPosition: existing.position,
                newPosition: updated.position
            });
        }

        res.json({ ...updated, fullName: `${updated.firstName} ${updated.lastName}` });
    } catch (e) { next(e); }
});

// ─── DELETE Employee (Tenant Locked) ─────────────────────────────────────────
router.delete('/:id', authenticate, tenantGuard, validateTenantResource(prisma.employee), async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.employee.delete({ where: { id, companyId: req.tenantId } });
        res.json({ success: true, message: `Employee ${id} deleted.` });
    } catch (e) { next(e); }
});

// ─── POST Upload Profile Photo ────────────────────────────────────────────────
router.post('/:id/photo', authenticate, uploadPhotoMiddleware.single('photo'), EmployeesController.uploadPhoto);

// ─── POST Upload Documents ───────────────────────────────────────────────────
router.post('/:id/upload', requireRole([Role.ADMIN, Role.HR]), uploadDocuments.array('files', 10), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { documentType = 'OTHER' } = req.body;
        const uploadedBy = (req.user as any)?.email || 'hr@salery.ma';

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ error: 'Aucun fichier reçu.' });
        }

        const files = req.files as Express.Multer.File[];

        const savedDocs = await Promise.all(files.map(async (file) => {
            const relPath = path.join('uploads', 'employees', id, file.filename).replace(/\\/g, '/');
            const fileUrl = buildFileUrl(relPath);

            const doc = await prisma.employeeDocument.create({
                data: {
                    employeeId: id,
                    name: file.originalname,
                    type: (documentType as any),
                    fileUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadedBy,
                }
            });

            // Trigger Event for HR (Compliance check)
            const { eventBus, EVENTS } = await import('../../services/eventBus');
            eventBus.emitEvent(EVENTS.EMPLOYEE.DOCUMENT_UPLOADED, {
                companyId: (req as any).tenantId || (req.user as any).companyId,
                employeeId: id,
                employeeName: `Salarie ID: ${id}`,
                documentType,
                fileName: file.originalname
            });

            // Record timeline event (non-blocking)
            prisma.employeeEvent.create({
                data: {
                    employeeId: id,
                    type: 'DOCUMENT_UPLOADED',
                    title: 'Document Téléchargé',
                    description: `${file.originalname} (${(file.size / 1024).toFixed(1)} Ko)`,
                    metadata: { fileName: file.originalname, fileSize: file.size, documentType }
                }
            }).catch(console.error);

            return doc;
        }));

        res.status(201).json({ uploaded: savedDocs.length, documents: savedDocs });
    } catch (e) { next(e); }
});

// ─── GET Employee Documents ───────────────────────────────────────────────────
router.get('/:id/documents', requireRole([Role.ADMIN, Role.HR, Role.EMPLOYEE]), async (req, res, next) => {
    try {
        const docs = await prisma.employeeDocument.findMany({
            where: { employeeId: req.params.id },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(docs);
    } catch (e) { next(e); }
});

// ─── DELETE a Document ────────────────────────────────────────────────────────
router.delete('/:id/documents/:docId', requireRole([Role.ADMIN, Role.HR]), async (req, res, next) => {
    try {
        const { docId } = req.params;
        await prisma.employeeDocument.delete({ where: { id: docId } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

// ─── GET Employee Timeline ────────────────────────────────────────────────────
router.get('/:id/timeline', requireRole([Role.ADMIN, Role.HR, Role.EMPLOYEE]), async (req, res, next) => {
    try {
        const events = await prisma.employeeEvent.findMany({
            where: { employeeId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(events);
    } catch (e) { next(e); }
});

export const employeesRoutes = router;
