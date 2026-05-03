import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { authRoutes } from './modules/auth/auth.routes';
import { companiesRoutes } from './modules/companies/companies.routes';
import { employeesRoutes } from './modules/employees/employees.routes';
import { attendanceRoutes } from './modules/attendance/attendance.routes';
import { salariesRoutes } from './modules/salaries/salaries.routes';
import { documentsRoutes } from './modules/documents/documents.routes';
import { leavesRoutes } from './modules/leaves/leaves.routes';
import { sitesRoutes } from './modules/sites/sites.routes';
import { primesRoutes } from './modules/primes/primes.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { auditLogger } from './middleware/audit.middleware';
import { authLimiter, scanLimiter, apiLimiter } from './middleware/security.middleware';
import notificationPrefsRoutes from './modules/notifications/preferences.routes';
import inviteRoutes from './modules/invites/invite.routes';

export const app = express();

// Diagnostic Logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'https://salery.ma',
  'https://www.salery.ma',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(auditLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static upload files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
import { notificationRoutes } from './modules/notifications/notification.routes';

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/notifications', apiLimiter, notificationRoutes);
app.use('/api/v1/companies', apiLimiter, companiesRoutes);
app.use('/api/v1/employees', apiLimiter, employeesRoutes);
app.use('/api/v1/attendance/scan', scanLimiter); // scan gets stricter limit
app.use('/api/v1/attendance', apiLimiter, attendanceRoutes);
app.use('/api/v1/salaries', apiLimiter, salariesRoutes);
app.use('/api/v1/documents', apiLimiter, documentsRoutes);
app.use('/api/v1/leaves', apiLimiter, leavesRoutes);
app.use('/api/v1/sites', apiLimiter, sitesRoutes);
app.use('/api/v1/primes', apiLimiter, primesRoutes);
app.use('/api/v1/billing', billingRoutes);

app.use('/api/employees', employeesRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationPrefsRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/v1/invites', apiLimiter, inviteRoutes); // matches frontend API_URL base
app.use('/api/salaries', salariesRoutes);

app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0', modules: ['auth', 'employees', 'attendance', 'salaries', 'documents', 'leaves', 'sites', 'primes'] });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
