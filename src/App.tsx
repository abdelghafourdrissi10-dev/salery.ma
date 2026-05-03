import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/store.ts';
import { getCurrentUser } from './services/authService.ts';

// Components & Pages
import Auth from './components/Auth.tsx';
import RHLayout from './layouts/RHLayout.tsx';
import EmployeeLayout from './layouts/EmployeeLayout.tsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.tsx';
import Unauthorized from './pages/Unauthorized.tsx';
import NotFound from './pages/NotFound.tsx';
import SecureLoadingSpinner from './components/SecureLoadingSpinner.tsx';

// RH Modules
import Dashboard from './components/Dashboard.tsx';
import EmployeeManager from './components/EmployeeManager.tsx';
import EmployeeProfileWrapper from './components/EmployeeProfileWrapper.tsx';
import SiteManager from './components/SiteManager.tsx';
import AttendanceManager from './components/AttendanceManager.tsx';
import WorkTimeManager from './components/WorkTimeManager.tsx';
import PrimeManager from './components/PrimeManager.tsx';
import PayrollCalculator from './components/PayrollCalculator.tsx';
import SalariesHistory from './components/SalariesHistory.tsx';
import CnssComplianceModule from './components/CnssComplianceModule.tsx';
import LeaveManager from './components/LeaveManager.tsx';
import PlanningCalendar from './components/PlanningCommandCenter/PlanningCalendar.tsx';
import ComplianceManager from './components/ComplianceManager.tsx';
import Reports from './components/Reports.tsx';
import RecruitmentATS from './components/RecruitmentATS.tsx';
import LegalChat from './components/LegalChat.tsx';
import DocumentGenerator from './components/DocumentGenerator.tsx';
import SettingsManager from './components/SettingsManager.tsx';
import ReconstructionDashboard from './modules/historicalPayroll/components/ReconstructionDashboard.tsx';

// Employee Modules
import EmployeePortal from './components/EmployeePortal.tsx';
import SetupAccount from './components/SetupAccount.tsx';
import PrintPayslip from './pages/PrintPayslip.tsx';

import { calculateEmployeePayroll } from './services/payrollEngine.ts';

const App: React.FC = () => {
  const {
    user, setUser, employees, setEmployees, leaves, setLeaves, attendance, setAttendance,
    authLoading, isAuthenticated, setAuthStatus, lang, setLang
  } = useAppStore();

  // ZERO-TRUST BOOT SEQUENCE
  useEffect(() => {
    const boot = async () => {
      setAuthStatus({ loading: true });
      try {
        const { getCurrentUser } = await import('./services/authService');
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Still fetch companies to populate the context switcher
          const { api } = await import('./services/api');
          const response = await api.get('/auth/me');
          if (response.companies) {
            const { setAccessibleCompanies } = useAppStore.getState();
            setAccessibleCompanies(response.companies);
          }
          
          setAuthStatus({ authenticated: true });
        } else {
          setAuthStatus({ authenticated: false });
        }
      } catch (err) {
        console.error('Boot Error:', err);
        setAuthStatus({ authenticated: false, loading: false });
      } finally {
        setAuthStatus({ loading: false });
      }
    };
    boot();
  }, []);

  // ─── BACKEND SYNC ─────────────────────────────────────────────────────────────
  // Fetch ALL core data from PostgreSQL on every authenticated session.
  // This is the single source of truth — localStorage/Zustand is just a cache.
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncFromBackend = async () => {
      try {
        const { api } = await import('./services/api');

        // Parallel fetch for speed
        const [backendEmployees, backendLeaves, backendAttendance] = await Promise.allSettled([
          api.get('/employees'),
          api.get('/leaves'),
          api.get('/attendance'),
        ]);

        if (backendEmployees.status === 'fulfilled' && Array.isArray(backendEmployees.value)) {
          setEmployees(backendEmployees.value);
          console.log(`✅ Employees: ${backendEmployees.value.length} loaded from DB`);
        }

        if (backendLeaves.status === 'fulfilled' && Array.isArray(backendLeaves.value)) {
          setLeaves(backendLeaves.value);
          console.log(`✅ Leaves: ${backendLeaves.value.length} loaded from DB`);
        }

        if (backendAttendance.status === 'fulfilled' && Array.isArray(backendAttendance.value)) {
          setAttendance(backendAttendance.value);
          console.log(`✅ Attendance: ${backendAttendance.value.length} records loaded from DB`);
        }

      } catch (err) {
        console.warn('⚠️ Backend sync partially failed — some data may be cached', err);
      }
    };

    syncFromBackend();
  }, [isAuthenticated]);

  if (authLoading) {
    return <SecureLoadingSpinner userName={user?.firstName} />;
  }

  const RH_ROLES = ['SUPER_ADMIN', 'COMPANY_OWNER', 'DIRECTEUR_RH', 'TEAM_RH', 'COMPTABLE', 'SITE_MANAGER'] as any[];

  return (
    <Routes>
      {/* 2. Public / Auth Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Auth onLogin={(u) => { setUser(u); setAuthStatus({ authenticated: true }); }} lang={lang} setLang={setLang} />
      } />
      <Route path="/setup-account" element={<SetupAccount />} />

      {/* 3. Unauthorized Page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 3. RH / Admin Routes Group */}
      <Route path="/rh" element={
        <RoleProtectedRoute allowedRoles={RH_ROLES}>
          <RHLayout />
        </RoleProtectedRoute>
      }>
        <Route index element={<Navigate to="dash" replace />} />
        <Route path="dash" element={<Dashboard employees={employees} leaves={leaves} lang={lang} user={user!} />} />
        <Route path="emps" element={<EmployeeManager employees={employees} setEmployees={setEmployees} lang={lang} user={user!} onShowPricing={() => { }} />} />
        <Route path="emps/:employeeId" element={<EmployeeProfileWrapper employees={employees} setEmployees={setEmployees} lang={lang} user={user!} />} />
        <Route path="recrut" element={<RecruitmentATS lang={lang} user={user!} />} />
        <Route path="sites" element={<SiteManager employees={employees} lang={lang} user={user!} />} />
        <Route path="pointage" element={<AttendanceManager lang={lang} user={user!} employees={employees} />} />
        <Route path="workTime" element={<WorkTimeManager employees={employees} lang={lang} user={user!} />} />
        <Route path="primes" element={<PrimeManager employees={employees} lang={lang} user={user!} onUpdateEmployee={(e) => setEmployees(prev => prev.map(emp => emp.id === e.id ? e : emp))} />} />
        <Route path="calc" element={<PayrollCalculator employees={employees} lang={lang} user={user!} onShowPricing={() => { }} />} />
        <Route path="salaries" element={<SalariesHistory lang={lang} user={user!} />} />
        <Route path="cnssRisk" element={<CnssComplianceModule employees={employees} payrollResults={employees.map(e => calculateEmployeePayroll(e, attendance, [], [], [], 'Current'))} lang={lang} user={user!} />} />
        <Route path="leaves" element={<LeaveManager employees={employees} leaves={leaves} setLeaves={setLeaves} lang={lang} />} />
        <Route path="calendar" element={<PlanningCalendar lang={lang} />} />
        <Route path="compliance" element={<ComplianceManager employees={employees} attendance={attendance} lang={lang} user={user!} />} />
        <Route path="reports" element={<Reports employees={employees} leaves={leaves} lang={lang} user={user!} />} />
        <Route path="advisor" element={<LegalChat lang={lang} user={user!} />} />
        <Route path="docs" element={<DocumentGenerator lang={lang} user={user!} />} />
        <Route path="settings" element={<SettingsManager lang={lang} user={user!} setUser={setUser} />} />
        <Route path="reconstruction" element={<ReconstructionDashboard />} />
        <Route path="reconstruction/*" element={<ReconstructionDashboard />} />
      </Route>

      {/* 4. Employee Routes Group */}
      <Route path="/employee" element={
        <RoleProtectedRoute allowedRoles={['EMPLOYEE']}>
          <EmployeeLayout />
        </RoleProtectedRoute>
      }>
        <Route index element={<Navigate to="portal" replace />} />
        <Route path="portal" element={<EmployeePortal user={user!} employees={employees} leaves={leaves} attendance={attendance} lang={lang} />} />
        <Route path="settings" element={<SettingsManager lang={lang} user={user!} setUser={setUser} />} />
        {/* Alias modules for employee self-service */}
        <Route path="empDocs" element={<EmployeePortal user={user!} employees={employees} leaves={leaves} attendance={attendance} lang={lang} section="documents" />} />
        <Route path="empPay" element={<EmployeePortal user={user!} employees={employees} leaves={leaves} attendance={attendance} lang={lang} section="payslips" />} />
        <Route path="empLeaves" element={<EmployeePortal user={user!} employees={employees} leaves={leaves} attendance={attendance} lang={lang} section="leaves" />} />
      </Route>

      {/* 5. Isolated Print Routes */}
      <Route path="/print/payslip/:employeeId/:month" element={
        <RoleProtectedRoute allowedRoles={[...RH_ROLES, 'EMPLOYEE']}>
          <PrintPayslip />
        </RoleProtectedRoute>
      } />

      {/* 6. Root Redirect Logic */}
      <Route path="/" element={
        isAuthenticated ? (
          user?.role === 'EMPLOYEE' ? <Navigate to="/employee" replace /> : <Navigate to="/rh" replace />
        ) : <Navigate to="/login" replace />
      } />

      {/* 7. Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
