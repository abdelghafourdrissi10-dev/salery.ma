
import { 
  Employee, AttendanceRecord, PayrollResult, ProjectWorkforce, 
  Candidate, ExecutiveRecommendation, Language 
} from '../types';

/**
 * SALERY V14 ANALYTICS CORE (GOD MODE)
 * Calculates high-level executive insights.
 */

export const calculateProjectWorkforceROI = (projects: ProjectWorkforce[]): any => {
  return projects.map(p => ({
    ...p,
    efficiencyScore: p.actualLaborCost > 0 ? (p.completionPercentage / (p.actualLaborCost / p.budgetedLaborCost)) : 100
  }));
};

export const detectWorkforceGaps = (employees: Employee[], currentProjects: ProjectWorkforce[]): Candidate[] => {
  // Simulate gap detection based on project needs
  // Fix: aligned with Candidate interface from types.ts
  return [
    { 
      id: 'C1', 
      name: 'Yassine El Amrani', 
      fullName: 'Yassine El Amrani', 
      position: 'Chef de Chantier Senior', 
      cvScore: 92, 
      aiScore: 92, 
      status: 'interviewing', 
      matchReason: 'Match 100% avec les besoins du Projet Casa-Finance', 
      salaryExpectation: 15000,
      skills: ['Leadership', 'Management', 'BTP']
    },
    { 
      id: 'C2', 
      name: 'Fatima Zahra', 
      fullName: 'Fatima Zahra', 
      position: 'Comptable Analytique', 
      cvScore: 88, 
      aiScore: 88, 
      status: 'applied', 
      matchReason: 'Expertise Plan Comptable Marocain V10', 
      salaryExpectation: 9000,
      skills: ['Accounting', 'PCM', 'Finance']
    }
  ];
};

export const generateExecutiveRecommendations = (
  payrollResults: PayrollResult[], 
  lang: Language = 'fr'
): ExecutiveRecommendation[] => {
  const totalPayroll = payrollResults.reduce((acc, p) => acc + p.grossTotal, 0);
  
  return [
    {
      id: 'REC1',
      category: 'COST_SAVING',
      title: lang === 'ar' ? 'تحسين الساعات الإضافية' : 'Optimisation Heures Supplémentaires',
      description: lang === 'ar' ? 'تم اكتشاف زيادة بنسبة 12٪ في مشروع أغادير. ينصح بإضافة عامل واحد لتقليل تكاليف الوقت الإضافي.' : 'Hausse de 12% détectée sur le projet Agadir. Recruter 1 intérimaire réduirait les coûts globaux de 4,200 MAD.',
      impactValue: '-4,200 MAD',
      confidenceScore: 94
    },
    {
      id: 'REC2',
      category: 'SALARY',
      title: 'Ajustement Marché IT',
      description: 'Vos développeurs sont payés 15% sous la moyenne du marché à Casablanca. Risque de turnover élevé.',
      impactValue: '+8,500 MAD',
      confidenceScore: 89
    }
  ];
};

export const getLaborCostHeatmap = (attendance: AttendanceRecord[], projects: ProjectWorkforce[]): any => {
  // Mocking heatmap data: [HourOfDay, DayOfWeek, Intensity]
  return projects.map(p => ({
    projectName: p.name,
    intensity: Math.random() * 100,
    status: p.riskScore > 60 ? 'ALERTE_SURCHARGE' : 'STABLE'
  }));
};
