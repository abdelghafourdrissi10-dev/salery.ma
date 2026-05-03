import { 
  PrimeCategory, EmployeePrime, Employee, 
  PrimeCalculationResult, PrimeType, PrimeTemplate 
} from '../types';
import { SMIG_2026 } from '../constants';

export const PRIME_CATEGORIES: PrimeCategory[] = [
  {
    id: 'PC_TRANS_VILLE',
    code: 'PRIME_TRANSPORT_VILLE',
    name: 'Prime Transport (Urbain)',
    description: 'Trajet domicile-travail périmètre urbain',
    type: 'exoneree_plafonnee',
    plafondValue: 500,
    plafondType: 'fixed',
    soumisCnss: false,
    soumisIr: false,
    justificatifRequired: false,
    recurringDefault: true,
    active: true
  },
  {
    id: 'PC_TRANS_HORS',
    code: 'PRIME_TRANSPORT_HORS_VILLE',
    name: 'Prime Transport (Inter-urbain)',
    description: 'Trajet hors périmètre urbain (Justificatif obligatoire)',
    type: 'exoneree_plafonnee',
    plafondValue: 750,
    plafondType: 'fixed',
    soumisCnss: false,
    soumisIr: false,
    justificatifRequired: true,
    recurringDefault: false,
    active: true
  },
  {
    id: 'PC_PANIER',
    code: 'PRIME_PANIER',
    name: 'Indemnité de Panier',
    description: 'Frais de nourriture sur site',
    type: 'exoneree_plafonnee',
    plafondType: 'smig_based',
    soumisCnss: false,
    soumisIr: false,
    justificatifRequired: false,
    recurringDefault: true,
    active: true
  },
  {
    id: 'PC_TOURNEE',
    code: 'PRIME_TOURNEE',
    name: 'Prime de Tournée',
    description: 'Déplacements fréquents itinérants',
    type: 'exoneree_plafonnee',
    plafondValue: 1500,
    plafondType: 'fixed',
    soumisCnss: false,
    soumisIr: false,
    justificatifRequired: true,
    recurringDefault: false,
    active: true
  },
  {
    id: 'PC_RENDEMENT',
    code: 'PRIME_RENDEMENT',
    name: 'Prime de Rendement',
    description: 'Performance individuelle (Totalement imposable)',
    type: 'taxable',
    plafondType: 'none',
    soumisCnss: true,
    soumisIr: true,
    justificatifRequired: false,
    recurringDefault: false,
    active: true
  },
  {
    id: 'PC_OBJECTIF',
    code: 'PRIME_OBJECTIF',
    name: 'Prime d\'Objectif',
    description: 'Atteinte des KPIs annuels',
    type: 'taxable',
    plafondType: 'none',
    soumisCnss: true,
    soumisIr: true,
    justificatifRequired: false,
    recurringDefault: false,
    active: true
  }
];

export const PRIME_TEMPLATES: PrimeTemplate[] = [
  {
    id: 'TPL_CHANTIER',
    name: 'Gabarit: Ouvrier Chantier',
    description: 'Optimisé pour les profils itinérants hors ville avec panier repas.',
    primes: [
      { categoryId: 'PC_TRANS_HORS', amount: 750 },
      { categoryId: 'PC_PANIER', amount: 500 },
      { categoryId: 'PC_TOURNEE', amount: 1500 }
    ]
  },
  {
    id: 'TPL_BUREAU',
    name: 'Gabarit: Employé Bureau',
    description: 'Structure standard pour les profils administratifs urbains.',
    primes: [
      { categoryId: 'PC_TRANS_VILLE', amount: 500 },
      { categoryId: 'PC_RENDEMENT', amount: 1000 }
    ]
  }
];

export const calculatePrimeParts = (
  employeePrime: EmployeePrime,
  category: PrimeCategory,
  workedDays: number = 26
): PrimeCalculationResult => {
  let exemptPart = 0;
  let taxablePart = 0;
  const amount = employeePrime.amount;

  if (category.type === 'taxable') {
    taxablePart = amount;
  } else if (category.type === 'exoneree_plafonnee') {
    let plafond = 0;
    if (category.plafondType === 'fixed') {
      plafond = category.plafondValue || 0;
    } else if (category.plafondType === 'smig_based') {
      // 2 x SMIG Hourly x Worked Days
      plafond = 2 * SMIG_2026 * workedDays;
    }

    exemptPart = Math.min(amount, plafond);
    taxablePart = Math.max(0, amount - exemptPart);
  } else if (category.type === 'obligatoire') {
    taxablePart = amount;
  }

  // Risk Detection
  let riskAlert: string | undefined;
  if (category.justificatifRequired && !employeePrime.justificationFile) {
    riskAlert = "JUSTIFICATIF_MANQUANT: Risque de redressement CNSS";
  }

  return {
    categoryId: category.id,
    totalAmount: amount,
    exemptPart,
    taxablePart,
    cnssBasePart: category.soumisCnss ? amount : taxablePart,
    irBasePart: category.soumisIr ? amount : taxablePart,
    riskAlert
  };
};

export const calculateSeniorityBonus = (employee: Employee): number => {
  const hireDate = new Date(employee.hireDate);
  const now = new Date();
  let years = now.getFullYear() - hireDate.getFullYear();
  if (now.getMonth() < hireDate.getMonth() || (now.getMonth() === hireDate.getMonth() && now.getDate() < hireDate.getDate())) {
    years--;
  }
  
  if (years >= 25) return employee.baseSalary * 0.25;
  if (years >= 20) return employee.baseSalary * 0.20;
  if (years >= 12) return employee.baseSalary * 0.15;
  if (years >= 5) return employee.baseSalary * 0.10;
  if (years >= 2) return employee.baseSalary * 0.05;
  return 0;
};