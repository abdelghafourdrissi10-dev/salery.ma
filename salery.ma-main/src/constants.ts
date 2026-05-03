export const SMIG_2026 = 17.92; 
export const MONTHLY_SMIG = 3422.72; // 17.92 * 191 hours

// --- CNSS & AMO RATES (MOROCCO 2026) ---
export const CNSS_SALARIAL_RATE = 0.0448; // 4.48%
export const CNSS_PATRONAL_RATE = 0.2109; // 21.09%
export const CNSS_CEILING = 6000;

export const AMO_SALARIAL_RATE = 0.0226; // 2.26%
export const AMO_PATRONAL_RATE = 0.0226; // 2.26%

// --- V23 CMIR RETIREMENT RATES ---
export const CMIR_SALARIAL_RATE = 0.0300; // 3.00%
export const CMIR_PATRONAL_RATE = 0.0300; // 3.00%

// --- OVERTIME MULTIPLIERS (CODE DU TRAVAIL) ---
export const OT_RATES = {
  JOUR_NORMAL: 1.25,      // +25%
  NUIT_NORMAL: 1.50,      // +50%
  JOUR_REPOS_FERIE: 1.50, // +50%
  NUIT_REPOS_FERIE: 2.00  // +100%
};

// --- FISCAL CONSTANTS ---
export const PROF_EXPENSES_RATE = 0.20;
export const PROF_EXPENSES_CAP = 2500;

export const IR_BRACKETS = [
  { min: 0, max: 2500, rate: 0, deduction: 0 },
  { min: 2501, max: 4166.67, rate: 0.1, deduction: 250 },
  { min: 4166.68, max: 5000, rate: 0.2, deduction: 666.67 },
  { min: 5001, max: 6666.67, rate: 0.3, deduction: 1166.67 },
  { min: 6666.68, max: 15000, rate: 0.34, deduction: 1433.33 },
  { min: 15000.01, max: Infinity, rate: 0.38, deduction: 2033.33 },
];

export const FAMILY_ALLOWANCE_PER_CHILD = 300;

/**
 * MOROCCAN PUBLIC HOLIDAYS 2026
 */
export const MOROCCAN_HOLIDAYS = [
  { month: 0, day: 1, names: { fr: 'Nouvel an', en: "New Year's Day", ar: 'رأس السنة الميلادية' }, type: 'NATIONAL' },
  { month: 0, day: 11, names: { fr: 'Manifeste de l\'Indépendance', en: 'Independence Manifesto', ar: 'تقديم وثيقة الاستقلال' }, type: 'NATIONAL' },
  { month: 0, day: 14, names: { fr: 'Nouvel An Amazigh', en: 'Amazigh New Year', ar: 'رأس السنة الأمازيغية' }, type: 'NATIONAL' },
  { month: 4, day: 1, names: { fr: 'Fête du Travail', en: 'Labor Day', ar: 'عيد الشغل' }, type: 'NATIONAL' },
  { month: 6, day: 30, names: { fr: 'Fête du Trône', en: 'Throne Day', ar: 'عيد العرش' }, type: 'NATIONAL' },
  { month: 7, day: 14, names: { fr: 'Allégeance Oued Eddahab', en: 'Oued Eddahab Allegiance', ar: 'ذكرى استرجاع إقليم وادي الذهب' }, type: 'NATIONAL' },
  { month: 7, day: 20, names: { fr: 'Révolution du Roi et du Peuple', en: 'Revolution of the King and the People', ar: 'ذكرى ثورة الملك والشعب' }, type: 'NATIONAL' },
  { month: 7, day: 21, names: { fr: 'Fête de la Jeunesse', en: 'Youth Day', ar: 'عيد الشباب' }, type: 'NATIONAL' },
  { month: 10, day: 6, names: { fr: 'Marche Verte', en: 'Green March', ar: 'ذكرى المسيرة الخضراء' }, type: 'NATIONAL' },
  { month: 10, day: 18, names: { fr: 'Fête de l\'Indépendance', en: 'Independence Day', ar: 'عيد الاستقلال' }, type: 'NATIONAL' }
];