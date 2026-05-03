import { 
  Employee, AttendanceRecord, PayrollResult, HRMetricSummary, 
  PayrollForecast, FraudAlert, ProjectPlanning, SalaryRecommendation,
  Candidate, MobileSyncStats, FinancialInsight, BankReconRecord,
  TreasuryState, BankAccount, RetirementReadiness
} from '../types';

/**
 * GOD MODE V23 ANALYTICS ENGINE
 * Continental Data Orchestration & Retirement Intelligence
 */

export const getContinentalPresence = () => {
  return [
    { country: 'Morocco', employees: 840, status: 'SOVEREIGN_CORE', color: '#0052FF' },
    { country: 'Senegal', employees: 125, status: 'OHADA_NODE', color: '#0E6F5C' },
    { country: 'Ivory Coast', employees: 94, status: 'OHADA_NODE', color: '#F4B400' },
    { country: 'UAE', employees: 12, status: 'GCC_STRATEGY', color: '#1A1F36' }
  ];
};

export const getRetirementReadiness = (employees: Employee[]): RetirementReadiness[] => {
  return employees.slice(0, 5).map(e => ({
    accruedPoints: Math.floor(Math.random() * 5000),
    projectedMonthlyPension: Math.floor(e.baseSalary * 0.65),
    eligibilityDate: '2045-06-15',
    readinessScore: 75 + Math.random() * 20,
    careerDensity: 92
  }));
};

export const getHRMetrics = (employees: Employee[]): HRMetricSummary => {
  const depts = Array.from(new Set(employees.map(e => e.department || 'Opérations')));
  return {
    totalEmployees: employees.length,
    activeRecruitments: 4,
    avgPerformanceScore: 82.5,
    turnoverRate: 3.8,
    deptBreakdown: depts.map((d, i) => ({
      name: d,
      count: employees.filter(e => (e.department || 'Opérations') === d).length,
      color: ['#1C3FAA', '#F4B400', '#0E6F5C', '#7C3AED', '#E11D48'][i % 5]
    }))
  };
};

export const generatePayrollCalculatedFields = (employees: Employee[]): PayrollResult[] => {
  return employees.map(e => {
    const gross = e.baseSalary;
    const primes = Math.random() > 0.7 ? 1500 : 0;
    const cnss = Math.min(gross + primes, 6000) * 0.0448;
    const amo = (gross + primes) * 0.0226;
    const cmir = (gross + primes) * 0.03;
    const net = gross + primes - (cnss + amo + cmir);
    
    return {
      employeeId: e.id,
      month: 'Nov 2025',
      country: e.country || 'MA',
      baseSalary: gross,
      seniorityBonus: 0,
      workedDays: 26,
      overtimeTotal: 0,
      primesTotal: primes,
      grossTotal: gross + primes,
      professionalExpenses: (gross + primes) * 0.2,
      netImposable: (gross + primes) * 0.8,
      cnss,
      amo,
      cmir,
      ir: 0,
      advancesDeduction: 0,
      netSalary: net,
      employerCharges: { cnss: (gross + primes) * 0.21, amo: (gross + primes) * 0.02, cmir: (gross + primes) * 0.03, total: (gross + primes) * 0.26 },
      breakdown: []
    };
  });
};

export const getTreasuryStateV22 = (payroll: PayrollResult[]): TreasuryState => {
  const liability = payroll.reduce((acc, p) => acc + p.netSalary, 0);
  const tax = payroll.reduce((acc, p) => acc + p.ir, 0);
  const cnss = payroll.reduce((acc, p) => acc + p.cnss + p.employerCharges.cnss, 0);
  const cmir = payroll.reduce((acc, p) => acc + p.cmir + p.employerCharges.cmir, 0);
  
  return {
    totalLiquidity: 1250000,
    salaryRunwayDays: 42,
    upcomingPayrollLiability: liability,
    cnssLiability: cnss,
    cmirLiability: cmir,
    taxLiability: tax,
    fundingGap: 0,
    accounts: [
      { id: '1', bank: 'ATTIJARIWAFA', label: 'Main Operational', balance: 950000, accountNumber: '***45', currency: 'MAD', lastSync: Date.now(), status: 'CONNECTED' },
      { id: '2', bank: 'CIH', label: 'Pension Reserve', balance: 300000, accountNumber: '***11', currency: 'MAD', lastSync: Date.now(), status: 'CONNECTED' }
    ],
    riskScore: {
      liquidity: 15,
      payrollDelay: 2,
      complianceRisk: 5,
      pensionRisk: 2,
      status: 'OPTIMAL'
    }
  };
};

export const getFinancialInsights = (): FinancialInsight[] => {
  return [
    { month: 'Jun', expenses: 650000, revenue: 1200000, payroll: 450000, projectCosts: 200000 },
    { month: 'Jul', expenses: 720000, revenue: 1450000, payroll: 480000, projectCosts: 240000 },
    { month: 'Aug', expenses: 810000, revenue: 1300000, payroll: 510000, projectCosts: 300000 },
    { month: 'Sep', expenses: 780000, revenue: 1600000, payroll: 490000, projectCosts: 290000 },
    { month: 'Oct', expenses: 920000, revenue: 1800000, payroll: 550000, projectCosts: 370000 },
    { month: 'Nov', expenses: 880000, revenue: 1750000, payroll: 540000, projectCosts: 340000 },
  ];
};

export const getBankReconData = (employees: Employee[]): BankReconRecord[] => {
  return employees.slice(0, 10).map(e => ({
    employeeId: e.id,
    employeeName: e.fullName,
    payrollAmount: e.baseSalary * 0.85,
    status: Math.random() > 0.15 ? 'reconciled' : Math.random() > 0.5 ? 'pending' : 'anomaly'
  }));
};

export const getPayrollForecast = (): PayrollForecast[] => {
  return [
    { month: 'Sep 2025', actualNet: 780000, predictedNet: 775000, variance: 0.6, confidence: 99 },
    { month: 'Oct 2025', actualNet: 845000, predictedNet: 840000, variance: 0.5, confidence: 98 },
    { month: 'Nov 2025', actualNet: 912000, predictedNet: 910000, variance: 0.2, confidence: 97 },
    { month: 'Dec 2025', actualNet: 0, predictedNet: 985000, variance: 0, confidence: 94 },
    { month: 'Jan 2026', actualNet: 0, predictedNet: 1040000, variance: 0, confidence: 89 }
  ];
};

export const detectFraudAnomaliesV14 = (employees: Employee[]): FraudAlert[] => {
  const alerts: FraudAlert[] = [];
  const ribs = new Map();
  
  employees.forEach(e => {
    if (e.rib) {
      if (ribs.has(e.rib)) {
        alerts.push({
          id: `F-${Date.now()}-1`,
          type: 'RIB_DUPLICATE',
          description: `Duplicate RIB detected for ${e.fullName} and ${ribs.get(e.rib)}. Potential ghost employee pattern.`,
          severity: 'CRITICAL',
          status: 'pending',
          date: new Date().toISOString(),
          evidenceId: e.id
        });
      } else ribs.set(e.rib, e.fullName);
    }
  });

  return alerts;
};

export const getProjectPlanningV14 = (): ProjectPlanning[] => [
  { id: 'P1', name: 'Chantier Casa-Finance', manager: 'Y. Amrani', laborBudget: 450000, laborActual: 412000, laborForecast: 430000, assignedEmployees: 12, completion: 85, staffingStatus: 'OPTIMAL', onTime: true, aiRecommendation: 'Maintain current staffing levels. Phase 3 onboarding delayed to Dec 1.' },
  { id: 'P2', name: 'Rénovation Agadir', manager: 'F. Zahra', laborBudget: 280000, laborActual: 310000, laborForecast: 340000, assignedEmployees: 8, completion: 65, staffingStatus: 'OVER', onTime: false, aiRecommendation: 'Reduce overtime by 15% to meet budget constraints. Audit timesheets for Site S2.' },
  { id: 'P3', name: 'Tanger Logistique', manager: 'O. Bakali', laborBudget: 1200000, laborActual: 245000, laborForecast: 1100000, assignedEmployees: 15, completion: 15, staffingStatus: 'UNDER', onTime: true, aiRecommendation: 'Onboard 4 new field workers immediately to meet Milestone B. Labor market tight in North region.' }
];

export const getCandidatePipeline = (): Candidate[] => [
  // Fix: Added missing required position property to Candidate objects
  { id: 'C1', name: 'Karim El Alami', position: 'Backend Engineer', cvScore: 94, skills: ['FastAPI', 'Kafka', 'HRIS Orchestration'], status: 'interviewing' },
  // Fix: Added missing required position property to Candidate objects
  { id: 'C2', name: 'Meryem Tazi', position: 'HR Compliance Officer', cvScore: 88, skills: ['Moroccan Labor Law', 'Payroll Compliance', 'Audit'], status: 'offered' },
  // Fix: Added missing required position property to Candidate objects
  { id: 'C3', name: 'Omar Mansouri', position: 'Financial Auditor', cvScore: 76, skills: ['Accounting', 'Audit', 'ERP SAP'], status: 'applied' },
  // Fix: Added missing required position property to Candidate objects
  { id: 'C4', name: 'Hiba Rahmouni', position: 'Field Operations Manager', cvScore: 91, skills: ['Data Analysis', 'Looker Studio', 'BTP Management'], status: 'interviewing' }
];

export const getMobileSyncStatsV14 = (): MobileSyncStats => ({
  pendingSyncCount: 14,
  lastSyncTime: new Date().toISOString(),
  offlineLogsSummary: [
    { employee: 'Anas B.', timestamp: '2025-11-20 14:22', status: 'pending' },
    { employee: 'Hiba R.', timestamp: '2025-11-20 14:15', status: 'pending' },
    { employee: 'Youssef L.', timestamp: '2025-11-20 13:58', status: 'pending' }
  ],
  voiceCommandUsage: [
    { date: '2025-11-15', count: 42 },
    { date: '2025-11-16', count: 56 },
    { date: '2025-11-17', count: 38 },
    { date: '2025-11-18', count: 89 },
    { date: '2025-11-19', count: 92 },
    { date: '2025-11-20', count: 45 }
  ]
});

export const getSalaryRecommendationsV14 = (employees: Employee[]): SalaryRecommendation[] => {
  return employees.slice(0, 4).map((e, i) => ({
    employeeId: e.id,
    employeeName: e.fullName,
    currentSalary: e.baseSalary,
    suggestedRaise: e.baseSalary * (i % 2 === 0 ? 0.12 : 0.08), 
    marketBenchmark: e.baseSalary * 1.15,
    reason: i % 2 === 0 ? 'Exceptional Performance + High Market Demand (IT Casablanca).' : 'Inflation Adjustment + Seniority Milestone.'
  }));
};