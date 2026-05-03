import { Site, SiteEmployee, SitePrime, Employee, PayrollResult, AttendanceRecord, SiteCostSummary, UserRole } from '../types';

/**
 * SALERY.MA - SITE MANAGER SERVICE V1
 * Multi-site management with automated compliance and cost tracking.
 */

export const getSites = (): Site[] => {
  const saved = localStorage.getItem('salaire_sites');
  return saved ? JSON.parse(saved) : [];
};

export const createSite = (data: any, userRole: UserRole): Site => {
  // Seul le SUPER_ADMIN ou le DIRECTEUR_RH (RH_ADMIN simulé ici par DIRECTEUR_RH) peut créer un site
  if (!['SUPER_ADMIN', 'DIRECTEUR_RH', 'RH_ADMIN'].includes(userRole)) {
    throw new Error("Permission refusée pour la création de site.");
  }

  const newSite: Site = {
    id: `SITE-${Date.now()}`,
    companyId: 'TENANT-8821', // Simulation
    name: data.name || '',
    code: data.code || `S-${Date.now().toString().slice(-4)}`,
    type: data.type || 'chantier',
    city: data.city || '',
    address: data.address || '',
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    status: 'active',
    managerId: data.managerId || '',
    workTemplateId: data.workTemplateId || 'TPL-44H-6D',
    budget: data.budget || 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lat: data.lat || 33.5731,
    lng: data.lng || -7.5898,
    radius: data.radius || 500
  };

  const existing = getSites();
  localStorage.setItem('salaire_sites', JSON.stringify([...existing, newSite]));

  // Initialisation des primes sectorielles selon le choix de l'utilisateur (toggle)
  const autoPrimes = data.autoPrimes !== undefined ? data.autoPrimes : false;

  const defaultPrimes: SitePrime[] = [
    {
      id: `SP-TRANS-${newSite.id}`,
      siteId: newSite.id,
      primeCategoryId: 'PC_TRANS_HORS',
      defaultAmount: 750,
      is_active: autoPrimes,
      auto_apply_to_employees: true,
      activated_at: autoPrimes ? Date.now() : undefined
    },
    {
      id: `SP-PANIER-${newSite.id}`,
      siteId: newSite.id,
      primeCategoryId: 'PC_PANIER',
      defaultAmount: 500,
      is_active: autoPrimes,
      auto_apply_to_employees: true,
      activated_at: autoPrimes ? Date.now() : undefined
    }
  ];

  const existingPrimesRaw = localStorage.getItem('salaire_site_primes');
  const existingPrimes = existingPrimesRaw ? JSON.parse(existingPrimesRaw) : [];
  localStorage.setItem('salaire_site_primes', JSON.stringify([...existingPrimes, ...defaultPrimes]));

  return newSite;
};

export const getSitePrimes = (siteId: string): SitePrime[] => {
  const saved = localStorage.getItem('salaire_site_primes');
  if (!saved) return [];
  const allPrimes: SitePrime[] = JSON.parse(saved);
  return allPrimes.filter(p => p.siteId === siteId);
};

export const toggleSitePrime = (siteId: string, categoryId: string, status: boolean, userId: string): void => {
  const saved = localStorage.getItem('salaire_site_primes');
  if (!saved) return;
  const allPrimes: SitePrime[] = JSON.parse(saved);

  const existingIndex = allPrimes.findIndex(p => p.siteId === siteId && p.primeCategoryId === categoryId);

  if (existingIndex >= 0) {
    allPrimes[existingIndex] = {
      ...allPrimes[existingIndex],
      is_active: status,
      modified_by: userId,
      [status ? 'activated_at' : 'deactivated_at']: Date.now()
    };
  } else if (status) {
    allPrimes.push({
      id: `SP-${categoryId}-${Date.now()}`,
      siteId: siteId,
      primeCategoryId: categoryId,
      defaultAmount: 0,
      is_active: status,
      auto_apply_to_employees: true,
      activated_at: Date.now(),
      modified_by: userId
    });
  }

  localStorage.setItem('salaire_site_primes', JSON.stringify(allPrimes));
};

export const assignEmployeeToSite = (employeeId: string, siteId: string): SiteEmployee => {
  const assignment: SiteEmployee = {
    id: `SA-${Date.now()}`,
    siteId,
    employeeId,
    startDate: new Date().toISOString().split('T')[0],
    active: true,
    roleOnSite: 'Staff',
    createdAt: Date.now()
  };

  const savedAssignments = localStorage.getItem('salaire_site_employees');
  const existing: SiteEmployee[] = savedAssignments ? JSON.parse(savedAssignments) : [];

  const updated = existing.map(a => a.employeeId === employeeId ? { ...a, active: false, endDate: new Date().toISOString().split('T')[0] } : a);

  localStorage.setItem('salaire_site_employees', JSON.stringify([...updated, assignment]));
  return assignment;
};

export const calculateSiteCost = (siteId: string, payroll: PayrollResult[]): SiteCostSummary => {
  const assignmentsRaw = localStorage.getItem('salaire_site_employees');
  const assignments: SiteEmployee[] = assignmentsRaw ? JSON.parse(assignmentsRaw) : [];
  const siteEmpIds = assignments.filter(a => a.siteId === siteId && a.active).map(a => a.employeeId);

  const sitePayroll = payroll.filter(p => siteEmpIds.includes(p.employeeId));

  const totalBase = sitePayroll.reduce((acc, p) => acc + p.baseSalary, 0);
  const totalOT = sitePayroll.reduce((acc, p) => acc + p.overtimeTotal, 0);
  const totalExempt = sitePayroll.reduce((acc, p) => acc + (p.primeResults?.reduce((s, pr) => s + pr.exemptPart, 0) || 0), 0);
  const totalTaxable = sitePayroll.reduce((acc, p) => acc + (p.primeResults?.reduce((s, pr) => s + pr.taxablePart, 0) || 0), 0);
  const totalCnss = sitePayroll.reduce((acc, p) => acc + (p.cnss + p.employerCharges.cnss), 0);
  const totalIr = sitePayroll.reduce((acc, p) => acc + p.ir, 0);

  const totalCost = totalBase + totalOT + totalExempt + totalTaxable + totalCnss + totalIr;

  return {
    totalEmployees: siteEmpIds.length,
    totalWorkedHours: sitePayroll.reduce((acc, p) => acc + (p.workedDays * 8), 0),
    totalBaseSalaries: totalBase,
    totalOvertime: totalOT,
    totalTaxablePrimes: totalTaxable,
    totalExemptPrimes: totalExempt,
    totalCnss,
    totalIr,
    totalPayrollCost: totalCost,
    avgCostPerEmployee: siteEmpIds.length > 0 ? totalCost / siteEmpIds.length : 0,
    overtimeRatio: totalBase > 0 ? (totalOT / totalBase) * 100 : 0,
    primeRatio: totalBase > 0 ? ((totalExempt + totalTaxable) / totalBase) * 100 : 0,
    budgetVariance: 0
  };
};