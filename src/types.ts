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
  | 'SITE_VIEW'
  | 'HISTORICAL_AUDIT_MANAGE';

export type PlanType = 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
export type LoginContext = 'EMPLOYEE' | 'TEAM_RH';

// --- ENTERPRISE CONFIGURATION V24 ---
export interface EnterprisePayrollConfig {
  countryCode: CountryCode;
  smigValue: number;
  cnssCeiling: number;
  cnssRate: number;      // Added for deterministic calc
  cnssPatronalRate: number;
  amoRate: number;
  amoPatronalRate: number;
  cmirRate: number;
  cmirPatronalRate: number;
  irBrackets: { min: number; max: number; rate: number; deduction: number }[];
  primeCategories: PrimeCategory[];
  familyAllowancePerChild: number;
  maxFamilyChildren: number;
}

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
  historicalSource?: boolean;
  // --- V24 ENTERPRISE FIELDS ---
  payrollRunId?: string;
  realSalary?: number;   // contractual
  paidSalary?: number;   // actual
  differenceClassification?: 'bonus' | 'allowance' | 'regularization' | 'none';
  auditFlags?: {
    salaryJumpWarning: boolean; // > 30%
    unusualBonusDetected: boolean;
    cnssInconsistency: boolean;
    missingAttendanceData: boolean;
  };
}

export interface EmployeePayrollTimeline {
  id: string;
  employeeId: string;
  payrollRunId: string;
  month: string;
  event: string; // e.g., 'Payroll calculated for March 2026'
  timestamp: number;
}

export interface Employee {
  id: string;
  companyId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  civility?: 'MR' | 'MME' | 'MLLE';
  // Identity & Civic
  cin: string;
  cnssEmployee?: string;
  socialSecurityNumber?: string;
  cmirEmployee?: string;
  nationality?: string;
  dob?: string;
  dateOfBirth?: string;
  pob?: string;
  placeOfBirth?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | string;
  childrenCount?: number;

  // Contact
  email?: string;
  phoneNumber?: string;
  physicalAddress?: string;
  address?: string;
  city?: string;
  country: CountryCode;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContact?: string;
  
  // Banking
  rib?: string;
  bankName?: string;
  iban?: string;
  paymentMethod?: 'TRANSFER' | 'CASH';

  // Professional
  internalMatricule: string;
  jobTitle: string;
  department?: string;
  employmentStatus: 'active' | 'leaving' | 'terminated' | 'suspended';
  hireDate: string;
  baseSalary: number;
  salaryType: 'fixed' | 'hourly';
  assignedSite?: string;
  photoUrl?: string;
  contractType?: 'CDI' | 'CDD' | 'ANAPEC' | 'CHANTIER' | 'STAGE' | 'FREELANCE';
  manager?: string;
  profileCompletionScore?: number;

  overtimeRate?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  fixedPrimes?: number;
  sedi?: SEDI;
  payroll_archive?: PayrollHistory[];
  audit_suggestions?: HistoricalAuditSuggestion[];
  contractEndDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isArchived?: boolean;
  isDeleted?: boolean;
  archivedAt?: string;
  deletedAt?: string;
  // Badge & NFC System
  badgeId?: string;
  badgeQRCode?: string;
  badgeNFCId?: string;
  badgeStatus?: 'ACTIVE' | 'DISABLED';
  badgeToken?: string;
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
  manualReason?: string;
  validated: boolean;
}

export interface MonthlyAttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  day: number;
  hoursWorked: number;
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
  photoUrl?: string;
  employeeId?: string;
  assignedSite?: string;
  pushPreferences?: PushPreferences;
  companies?: { id: string; name: string; role: string }[];
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
  payroll_history?: PayrollHistory[];
  accounting_entries?: AccountingEntry[];
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
  photoUrl?: string;
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
  companyId: string;
  userId?: string;
  role?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
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
  totalLiquidity: number;
  salaryRunwayDays: number;
  upcomingPayrollLiability: number;
  cnssLiability: number;
  cmirLiability: number;
  taxLiability: number;
  accounts: BankAccount[];
  fundingGap: number;
  riskScore: FinancialRiskScore;
}

export type BankId = 'ATTIJARIWAFA' | 'CIH' | 'BP' | 'BOA' | 'CFG';

export interface BankAccount {
  id: string;
  bank: BankId;
  accountNumber: string;
  label: string;
  balance: number;
  currency: 'MAD' | 'USD' | 'EUR';
  lastSync: number;
  status: 'CONNECTED' | 'MFA_REQUIRED' | 'DISCONNECTED';
}

export interface FinancialRiskScore {
  liquidity: number;
  payrollDelay: number;
  complianceRisk: number;
  pensionRisk: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface RetirementReadiness {
  accruedPoints: number;
  projectedMonthlyPension: number;
  eligibilityDate: string;
  readinessScore: number;
  careerDensity: number;
}

export interface LawUpdate {
  lawId: string;
  category: string;
  summary: string;
  impactScore: number;
  effectiveDate: string;
  affectedRules: string[];
}

export interface ComplianceViolation {
  id: string;
  code: string;
  severity: LegalSeverity;
  lawReference: string;
  description: { fr: string; ar: string };
  remediation: string;
  status: 'OPEN' | 'RESOLVED';
  timestamp: number;
}

export interface InspectionRiskReport {
  overallRisk: string;
  missingDocs: string[];
  fraudIndicators: string[];
  estimatedPenaltyMAD: number;
  priorityActions: string[];
  lastAuditAt: number;
}

export interface LegalSimulationResult {
  scenarioName: string;
  financialImpact: number;
  litigationProbability: number;
  regulatoryScore: number;
  recommendations: string[];
}

export interface LegalEvent {
  id: string;
  tenantId: string;
  type: LegalEventType;
  severity: LegalSeverity;
  source: string;
  payload: any;
  timestamp: number;
  traceId: string;
}

export type LegalEventType =
  'LEGISLATIVE_UPDATE' |
  'COMPLIANCE_VIOLATION_DETECTED' |
  'RISK_THRESHOLD_EXCEEDED' |
  'CONTRACT_CERTIFIED' |
  'AUDIT_READY';

export type LegalEventSubscriber = (event: LegalEvent) => Promise<void>;

export interface NationalComplianceScore {
  overallScore: number;
  payrollIntegrity: number;
  taxRegularity: number;
  socialCoverage: number;
  laborLawAdherence: number;
  lastUpdate: number;
  certificationHash: string;
}

export type GovernmentAgentId = 'CNSS_VALIDATOR_AGENT' | 'TAX_RISK_AGENT' | 'LABOR_INSPECTOR_AGENT' | 'GOV_LIAISON_AGENT';

export interface GovAgentDirective {
  agentId: GovernmentAgentId;
  action: string;
  priority: 'URGENT' | 'NORMAL';
  validationRequired: boolean;
  traceId: string;
}

export interface GovernmentSubmission {
  id: string;
  type: 'CNSS_DAMANCOM' | 'DGI_SIMPLIS_IR' | 'CMIR_DECLARATION';
  period: string;
  status: 'PENDING' | 'VALIDATED_AI' | 'SUBMITTED' | 'REJECTED';
  hashSignature: string;
  auditTrail: string[];
}

export interface MinistryAnalytics {
  avgSalaryBySector: Record<string, number>;
  employmentTrends: { month: string; growth: number }[];
  complianceHeatmap: Record<string, number>;
}

export interface SDEI {
  id: string;
  ice: string;
  ifCode: string;
  cnssEmployer: string;
  legalStatus: string;
  digitalSignatureThumbprint: string;
  branches: string[];
  lastCertifiedAt: number;
  jurisdiction: string;
}

export interface SEDI {
  id: string;
  cin: string;
  cnssEmployee: string;
  workHistoryAnchors: WorkforceAnchor[];
  identityToken: string;
  status: 'VERIFIED' | 'PENDING';
  globalMobilityIndex: number;
}

export type IdentityAgentId = 'GHOST_DETECTOR' | 'WORKFORCE_MOBILITY_TRACKER';

export interface IdentityDirective {
  agentId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  actionRequired: string;
  evidenceHash: string;
}

export type BlockchainModule = 'PAYROLL' | 'CONTRACT' | 'IDENTITY' | 'LEAVE';

export interface WorkforceAnchor {
  txId: string;
  blockNumber: number;
  timestamp: number;
  sediId: string;
  sdeiId: string;
  category: BlockchainModule;
  proofHash: string;
  digitalSignature: string;
  validatorNode: string;
}

export interface WorkforceEdge {
  fromId: string;
  toId: string;
  relationship: 'EMPLOYED_BY' | 'FORMER_EMPLOYEE';
  contractHash: string;
  startDate: string;
  countryCode: string;
}

export interface CnssRiskMetrics {
  overallRiskScore: number;
  missingCnssNumbers: number;
  incorrectDeclarations: number;
  lateContributions: number;
  contractAnomalies: number;
  totalDueMAD: number;
  totalPaidMAD: number;
}

export interface CnssEmployeeRisk {
  employeeId: string;
  employeeName: string;
  cnssNumber: string;
  baseSalary: number;
  contributionPaid: number;
  contributionDue: number;
  status: 'COMPLIANT' | 'WARNING' | 'HIGH_RISK';
  issues: string[];
}

// --- ATS (APPLICANT TRACKING SYSTEM) ---
export type CandidateStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  type: 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'ANAPEC';
  status: 'draft' | 'published' | 'closed';
  description: string;
  requirements: string[];
  salaryRange?: { min: number; max: number; currency: string };
  openDate: string;
  closeDate?: string;
  createdBy: string;
  createdAt: number;
}

// --- HISTORICAL PAYROLL RECONSTRUCTION ENGINE ---

export interface PayrollHistory {
  id: string;
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  salaire_declare: number;
  salaire_reel: number;
  net_paye: number;
  primes_imported: number;
  avances_imported: number;
  heures_sup: number;
  auto_prime_generated: number;
  auto_avance_generated: number;
  reconstruction_status: 'draft' | 'validated' | 'archived';
  anomaly_flag: boolean;
  anomaly_details?: string;
  attendance_id?: string;
}

export interface AccountingEntry {
  id: string;
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  debit_account: string; // e.g. "6411"
  credit_account: string; // e.g. "421", "431", "445"
  amount: number;
  reference: string;
  label: string;
  createdAt: number;
}

export interface HistoricalAuditSuggestion {
  id: string;
  employeeId: string;
  type: 'pattern' | 'risk' | 'anomaly';
  message: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: number;
}

export interface HistoricalAttendance {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  daysWorked: number;
  hoursWorked: number;
  overtimeHours: number;
  absences: number;
}

// --- PLANNING TASK & MESSAGING SYSTEM ---
export type PlanningType = 'TASK' | 'NOTE' | 'ALERT' | 'EVENT';
export type PlanningPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type PlanningStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface PlanningItem {
  id: string;
  companyId: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  type: PlanningType;
  priority: PlanningPriority;
  status: PlanningStatus;
  assignedToUserId?: string;
  assignedToTeamId?: string;
  createdById: string;
  createdAt: number;
  updatedAt: number;
}

// --- DAILY ATTENDANCE (SIMPLIFIED HOURS-BASED) ---
export type DailyEntryType = 'WORK' | 'ABSENCE' | 'OVERTIME';

export interface DailyEntry {
  id: string;
  companyId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  hoursWorked: number;
  type: DailyEntryType;
  note?: string;
  updatedAt: number;
}
