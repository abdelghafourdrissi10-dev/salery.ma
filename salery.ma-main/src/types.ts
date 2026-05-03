export type Language = 'en' | 'fr' | 'ar';
export type CountryCode = 'MA';

// --- ENTERPRISE RBAC SYSTEM ---
export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_OWNER'
  | 'DIRECTEUR_RH'
  | 'TEAM_RH'
  | 'COMPTABLE'
  | 'SITE_MANAGER'
  | 'EMPLOYEE';

export type Permission =
  | 'EMPLOYEE_MANAGE'
  | 'EMPLOYEE_VIEW'
  | 'PAYROLL_EDIT'
  | 'PAYROLL_APPROVE'
  | 'PAYROLL_VIEW'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_VIEW'
  | 'FINANCIAL_EXPORT'
  | 'ABSENCE_MANAGE'
  | 'ABSENCE_APPROVE'
  | 'RECRUITMENT_MANAGE'
  | 'COMPANY_SETTINGS_EDIT'
  | 'SUBSCRIPTION_MANAGE'
  | 'ANALYTICS_VIEW'
  | 'SITE_VIEW';

export type PlanType = 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
export type LoginContext = 'EMPLOYEE' | 'TEAM_RH';

// --- SITE MANAGER ENGINE V1 ---
export type SiteType = 'chantier' | 'agence' | 'bureau' | 'projet';
export type SiteStatus = 'active' | 'completed' | 'suspended';

// Fix: Merged lat, lng, radius into the main Site interface to resolve duplication and missing property errors
export interface Site {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: SiteType;
  city: string;
  address: string;
  startDate: string;
  endDate?: string;
  status: SiteStatus;
  managerId: string; // user_id
  workTemplateId: string;
  budget: number;
  createdAt: number;
  updatedAt: number;
  lat: number;
  lng: number;
  radius: number;
}

export interface SiteEmployee {
  id: string;
  siteId: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  roleOnSite: string;
  active: boolean;
  createdAt: number;
}

// Updated for Site-level Prime Control
export interface SitePrime {
  id: string;
  siteId: string;
  primeCategoryId: string;
  defaultAmount: number;
  is_active: boolean;
  auto_apply_to_employees: boolean;
  activated_at?: number;
  deactivated_at?: number;
  modified_by?: string; // user_id
}

export interface SiteCostSummary {
  totalEmployees: number;
  totalWorkedHours: number;
  totalBaseSalaries: number;
  totalOvertime: number;
  totalTaxablePrimes: number;
  totalExemptPrimes: number;
  totalCnss: number;
  totalIr: number;
  totalPayrollCost: number;
  avgCostPerEmployee: number;
  overtimeRatio: number;
  primeRatio: number;
  budgetVariance: number;
}

// --- WORK TIME TEMPLATE ENGINE V1 ---
export type SectorType = 'non_agricole' | 'agricole';
export type AbsenceDeductionMode = 'hourly' | 'daily';

export interface WorkTimeTemplate {
  id: string;
  name: string;
  sector: SectorType;
  weeklyHours: number; // Default 44
  daysPerWeek: 5 | 6;
  dailyHours: number; // Calculated
  monthlyReferenceHours: number; // Default 191
  overtimeThresholdWeekly: number; // 44
  lateToleranceMinutes: number;
  absenceDeductionMode: AbsenceDeductionMode;
  active: boolean;
  createdAt: number;
}

export interface EmployeeWorkTemplate {
  id: string;
  employeeId: string;
  templateId: string;
  startDate: string;
  endDate?: string;
}

// --- V26 PRIME MANAGEMENT ENGINE ---
export type PrimeType = 'exoneree_plafonnee' | 'taxable' | 'obligatoire';
export type PlafondType = 'fixed' | 'smig_based' | 'none';

export interface PrimeCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  type: PrimeType;
  plafondValue?: number;
  plafondType: PlafondType;
  soumisCnss: boolean;
  soumisIr: boolean;
  justificatifRequired: boolean;
  recurringDefault: boolean;
  active: boolean;
}

export interface EmployeePrime {
  id: string;
  employeeId: string;
  categoryId: string;
  amount: number;
  isPercentage: boolean;
  startDate: string;
  endDate?: string;
  recurring: boolean;
  justificationFile?: string;
  status: 'active' | 'suspended' | 'expired';
}

export interface PrimeTemplate {
  id: string;
  name: string;
  description: string;
  primes: { categoryId: string; amount: number }[];
}

export interface PrimeCalculationResult {
  categoryId: string;
  totalAmount: number;
  exemptPart: number;
  taxablePart: number;
  cnssBasePart: number;
  irBasePart: number;
  riskAlert?: string;
}

// --- V25 DOCUMENT VAULT ---
export interface EmployeeDocument {
  id: string;
  type: 'CONTRACT' | 'CIN' | 'CNSS' | 'RIB' | 'DIPLOMA' | 'CV' | 'MEDICAL' | 'OTHER';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: number;
  expiryDate?: string;
  status: 'VALID' | 'EXPIRED' | 'REPLACED';
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'pending' | 'approved' | 'rejected';

export interface PayrollResult {
  employeeId: string;
  month: string;
  country: CountryCode;
  grossTotal: number;
  netSalary: number;
  cnss: number;
  cmir: number;
  amo: number;
  ir: number;
  base_primes_active?: string[]; // IDs of active site primes
  baseSalary: number;
  workedDays: number;
  netImposable: number;
  professionalExpenses: number;
  advancesDeduction: number;
  seniorityBonus: number;
  overtimeTotal: number;
  primesTotal: number;
  primeResults?: PrimeCalculationResult[];
  employerCharges: {
    cnss: number;
    amo: number;
    cmir: number;
    total: number;
  };
  breakdown: { label: string; amount: number; type: 'gain' | 'retenue' }[];
  v8Flags?: {
    isSmigCompliant: boolean;
    laborCourtRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    isHistoricalAnomaly?: boolean;
    identityVerified: boolean;
  };
}

export interface Employee {
  id: string;
  companyId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  civility?: 'MR' | 'MME' | 'MLLE';
  cin: string;
  cnssEmployee?: string;
  cmirEmployee?: string;
  internalMatricule: string;
  jobTitle: string;
  department?: string;
  employmentStatus: 'active' | 'leaving' | 'terminated' | 'suspended';
  hireDate: string;
  baseSalary: number;
  salaryType: 'fixed' | 'hourly';
  rib?: string;
  bankName?: string;
  iban?: string;
  paymentMethod?: 'TRANSFER' | 'CASH';
  email?: string;
  assignedSite?: string;
  photo?: string;
  contractType?: 'CDI' | 'CDD' | 'ANAPEC' | 'CHANTIER' | 'STAGE' | 'FREELANCE';
  phoneNumber?: string;
  physicalAddress?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  childrenCount?: number;
  dob?: string;
  pob?: string;
  nationality?: string;
  createdAt?: string;
  country: CountryCode;
  documents?: EmployeeDocument[];
  auditHistory?: ActionLog[];
  primes?: EmployeePrime[];
  manager?: string;
  overtimeRate?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  fixedPrimes?: number;
  sedi?: SEDI;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  status: AttendanceStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'scan' | 'manual';
  history: ActionLog[];
  checkIn?: string;
  checkOut?: string;
  breakDuration?: number;
  synced?: boolean;
  gpsTimeline: GpsPoint[];
  lastActionAt: number;
  siteId?: string;
  addedBy?: string;
  deviceId?: string;
  isInZone?: boolean;
  distanceFromSite?: number;
  isOfflineMode?: boolean;
  fraudScore?: number;
  lateMinutes?: number;
  overtimeHours?: number;
  validated: boolean;
  manualReason?: string;
}

export interface AuthUser {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  plan: PlanType;
  firstName: string;
  lastName: string;
  photo?: string;
  employeeId?: string;
  assignedSite?: string;
  pushPreferences?: PushPreferences;
}

export interface ActionLog {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: number;
  details?: string;
  ip?: string;
}

export interface GpsPoint {
  timestamp: number;
  lat: number;
  lng: number;
  accuracy: number;
  isInZone: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PushPreferences {
  attendance: boolean;
  approvals: boolean;
  fraud: boolean;
  sync: boolean;
}

export interface CalendarEvent {
  id: string;
  start: string;
  end?: string;
  title: string;
  type: 'ATTENDANCE' | 'LEAVE' | 'HOLIDAY' | 'SYSTEM';
  status: string;
  cost?: number;
  employeeId?: string;
  hours?: number;
  description?: string;
}

// Added timestamp property to fix errors in LegalChat.tsx
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: number;
}

export type LegalSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LegalDocStatus = 'DRAFT' | 'SIGNED' | 'VERIFIED' | 'EXPIRED';
export type GeneratedDocumentStatus = 'draft' | 'exported' | 'signed';

export enum DocType {
  CDI = 'CDI',
  CDD = 'CDD',
  ANAPEC = 'ANAPEC',
  CHANTIER = 'CHANTIER',
  STAGE = 'STAGE',
  FREELANCE = 'FREELANCE'
}

// --- COMPANY / TENANT ENTITY ---
export interface CompanySettings {
  defaultSignatoryName: string;
  defaultSignatoryRole?: string;
  companyStampUrl?: string;
  documentLanguage?: string;
}

export interface Company {
  id: string;
  legalName: string;
  ice: string;
  ifCode: string;
  cnssEmployer: string;
  rc: string;
  address: string;
  city: string;
  country: CountryCode;
  phone?: string;
  email?: string;
  logoUrl?: string;
  rib?: string;
  plan: PlanType;
  ownerId: string;
  settings: CompanySettings;
  createdAt: number;
}

/** @deprecated Use Company instead */
export interface CompanyProfile {
  id: string;
  name: string;
  physicalAddress: string;
  city: string;
  country: CountryCode;
  phone?: string;
  email?: string;
  rc: string;
  ice: string;
  ifCode?: string;
  cnssEmployer: string;
  rib?: string;
  logoUrl?: string;
  settings: CompanySettings;
}

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assignedSite: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  employeeId?: string;
}

export interface OptimizationConstraint {
  maxOvertimeHours: number;
  minRestHours: number;
  preferSeniorStaff: boolean;
}

export interface LaborCourtRisk {
  disputeProbability: number;
  legalReasoning: { fr: string; ar: string };
  penaltyEstimation: number;
  preventiveActions: string[];
}

export interface IndustryBenchmark {
  sector: string;
  avgSalary: number;
  percentiles: { p25: number; p50: number; p75: number };
}

export interface AccountingLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface AccountingJournalEntry {
  id: string;
  companyId: string;
  date: string;
  entryNumber: string;
  source: string;
  status: 'draft' | 'posted';
  lines: AccountingLine[];
  createdByAi: boolean;
  hashSignature: string;
}

export interface AiPrediction {
  id: string;
  predictionType: string;
  riskScore: number;
  recommendedAction: string;
  impactValue: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: number;
  read: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  templateName: string;
  content: string;
  hashSignature: string;
  createdAt: string;
  generatedByUserId: string;
}

export interface GeneratedDocument {
  id: string;
  companyId: string;
  employeeId: string;
  documentType: string;
  status: GeneratedDocumentStatus;
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
}

export interface SystemHealth {
  status: 'optimal' | 'degraded' | 'offline';
  uptime: string;
  latency: number;
  kafkaLag: number;
  activeMicroservices: number;
  services: MicroserviceHealth[];
  lastSnapshot: string;
}

export interface MicroserviceHealth {
  name: string;
  status: 'online' | 'offline';
  latency: number;
}

export interface ExecutiveDirective {
  id: string;
  title: { fr: string; ar: string };
  category: DirectiveCategory;
  priority: DirectivePriority;
  rationale: { fr: string; ar: string };
  suggestedActions: string[];
  impact: {
    financialMAD: number;
    legalRiskScore: number;
    productivityBoost: number;
  };
  timestamp: number;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  legalReference?: string;
}

export type DirectiveCategory = 'COMPLIANCE' | 'COST_CONTROL' | 'STRATEGY' | 'WORKFORCE';
export type DirectivePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FraudSignal {
  type: 'GPS' | 'DEVICE' | 'TIME' | 'SYNC' | 'PATTERN';
  score: number;
  description: string;
}

export interface SaaSAnalyticsData {
  mrr: {
    total: number;
    new: number;
    expansion: number;
    contraction: number;
    churned: number;
    netNew: number;
  };
  arr: {
    total: number;
    new: number;
    expansion: number;
    contraction: number;
    churned: number;
  };
  kpis: {
    churnRate: number;
    retentionRate: number;
    arpa: number;
    activeCount: number;
  };
  planBreakdown: Record<PlanType, { mrr: number, count: number, pct: number }>;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: PlanType;
  amount: number;
  interval: 'month' | 'year';
  status: 'active' | 'canceled';
  currentPeriodEnd: string;
  createdAt: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  type: 'new' | 'expansion' | 'contraction' | 'churn';
  mrrDelta: number;
  timestamp: string;
}

export interface Prime {
  id: string;
  amount: number;
  isSoumisCnss: boolean;
}

export interface OvertimeRecord {
  id: string;
  hours: number;
  type: string;
}

export interface SalaryAdvance {
  id: string;
  amount: number;
  monthlyDeduction: number;
}

export interface AiDecision {
  id: string;
  module: string;
  inputHash: string;
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasoning: {
    fr: string;
    ar: string;
    technical: string;
  };
  riskScore: number;
  timestamp: number;
  model: string;
  eventTrail: string[];
}

export type AutonomousAgentId = 'AI_HR_DIRECTOR' | 'AI_CMIR_PENSION_VALIDATOR' | 'AI_CROSS_BORDER_AGENT' | 'AI_COMPTABLE' | 'AI_CEO_BRAIN' | 'AI_LEGAL_COMPLIANCE' | 'AI_CFO_FINANCE';

export interface AiAgentCommunication {
  from: AutonomousAgentId;
  to: AutonomousAgentId | 'ALL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  dataPayload: any;
  traceId: string;
  status: 'SENT' | 'RECEIVED' | 'EXECUTED';
}

export interface OcrExtractionResult {
  docType: string;
  extractedData: {
    fullName?: string;
    idNumber?: string;
    cnssNumber?: string;
    salary?: number;
    startDate?: string;
    jobTitle?: string;
    confidence: number;
    isForgeryDetected?: boolean;
  };
  rawJson: string;
}

export interface FraudRiskReport {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAnomalies: {
    type: 'RIB_DUPLICATION' | 'PATTERN_ANOMALY';
    description: string;
    evidenceCode: string;
  }[];
  autonomousActions: string[];
}

export interface ProjectWorkforce {
  id: string;
  name: string;
  actualLaborCost: number;
  budgetedLaborCost: number;
  completionPercentage: number;
  riskScore: number;
}

export interface Candidate {
  id: string;

  // --- Legacy AI Engine Fields ---
  name?: string;
  fullName?: string;
  position?: string;
  cvScore?: number;
  aiScore?: number;
  status?: 'applied' | 'interviewing' | 'offered' | 'rejected';
  matchReason?: string;
  salaryExpectation?: number;
  skills?: string[];

  // --- New ATS Core Fields ---
  jobId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  coverLetter?: string;
  stage: CandidateStage;
  rating: number;
  notes: string;
  appliedDate: string;
  lastUpdated: number;
}

export interface ExecutiveRecommendation {
  id: string;
  category: 'COST_SAVING' | 'SALARY' | 'HIRING';
  title: string;
  description: string;
  impactValue: string;
  confidenceScore: number;
}

export interface HRMetricSummary {
  totalEmployees: number;
  activeRecruitments: number;
  avgPerformanceScore: number;
  turnoverRate: number;
  deptBreakdown: { name: string; count: number; color: string }[];
}

export interface PayrollForecast {
  month: string;
  actualNet: number;
  predictedNet: number;
  variance: number;
  confidence: number;
}

export interface FraudAlert {
  id: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'pending' | 'resolved';
  date: string;
  evidenceId: string;
}

export interface ProjectPlanning {
  id: string;
  name: string;
  manager: string;
  laborBudget: number;
  laborActual: number;
  laborForecast: number;
  assignedEmployees: number;
  completion: number;
  staffingStatus: 'OPTIMAL' | 'OVER' | 'UNDER';
  onTime: boolean;
  aiRecommendation: string;
}

export interface SalaryRecommendation {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  suggestedRaise: number;
  marketBenchmark: number;
  reason: string;
}

export interface MobileSyncStats {
  pendingSyncCount: number;
  lastSyncTime: string;
  offlineLogsSummary: { employee: string; timestamp: string; status: string }[];
  voiceCommandUsage: { date: string; count: number }[];
}

export interface FinancialInsight {
  month: string;
  expenses: number;
  revenue: number;
  payroll: number;
  projectCosts: number;
}

export interface BankReconRecord {
  employeeId: string;
  employeeName: string;
  payrollAmount: number;
  status: 'reconciled' | 'pending' | 'anomaly';
}

export interface TreasuryState {
  currentCash: number;
  projectedOutflow: number;
  burnRate: number;
  runwayMonths: number;
}

export interface SocialRecord {
  id: string;
  employeeId: string;
  period: string;
  cnssStatus: 'declared' | 'pending' | 'error';
  amoStatus: 'active' | 'inactive';
}

export interface Asset {
  id: string;
  type: 'LAPTOP' | 'PHONE' | 'VEHICLE' | 'TOOL';
  serial: string;
  assignedTo?: string;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
}

export type CandidateStage = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  description: string;
  requirements: string[];
  salaryRange?: { min: number; max: number };
  createdAt: string;
  applicationsCount: number;
}

export interface SEDI {
  id: string;
  employeeId: string;
  score: number;
  lastAssessment: string;
  recommendations: string[];
}