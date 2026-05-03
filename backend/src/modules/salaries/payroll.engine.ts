/**
 * MOROCCAN PAYROLL ENGINE
 * Compliant with 2024 Moroccan Labor Law & Tax Code.
 * 
 * Flow:
 * 1. Base Salary + Primes -> Gross Salary (Salaire Brut)
 * 2. Gross - Exemptions -> Taxable Gross (Brut Imposable)
 * 3. Deductions: CNSS (4.48%, cap 268.80 MAD), AMO (2.26%)
 * 4. Professional Expenses (Frais Professionnels): 25% (cap 2500 MAD/month)
 * 5. Net Taxable (Net Imposable)
 * 6. IR (Impôt sur le Revenu): Progressive Scale
 * 7. Net Salary
 */

export class PayrollEngine {
    // 2024 IR Scale (Monthly)
    private static IR_SCALE = [
        { limit: 2500, rate: 0, deduction: 0 },
        { limit: 4166.67, rate: 0.10, deduction: 250 },
        { limit: 5000, rate: 0.20, deduction: 666.67 },
        { limit: 6666.67, rate: 0.30, deduction: 1166.67 },
        { limit: 15000, rate: 0.34, deduction: 1433.33 },
        { limit: Infinity, rate: 0.38, deduction: 2033.33 }
    ];

    static calculate(baseSalary: number, primes: number = 0, deductions: number = 0) {
        const grossSalary = baseSalary + primes;
        
        // 1. Social Security (CNSS) - Employee Part
        // Rate: 4.48%, Cap: 6000 MAD of gross (Max: 268.80 MAD)
        const cnssBasis = Math.min(grossSalary, 6000);
        const cnss = cnssBasis * 0.0448;

        // 2. Health Insurance (AMO) - Employee Part
        // Rate: 2.26%, No Cap
        const amo = grossSalary * 0.0226;

        // 3. Taxable Gross (SBI - Salaire Brut Imposable)
        // For simplicity here, we assume all primes are taxable
        const sbi = grossSalary - cnss - amo;

        // 4. Professional Expenses (Frais Professionnels)
        // 25% of SBI, capped at 2500 MAD
        const professionalExpenses = Math.min(sbi * 0.25, 2500);

        // 5. Net Taxable (SNI - Salaire Net Imposable)
        const sni = sbi - professionalExpenses;

        // 6. Income Tax (IR)
        let irRaw = 0;
        for (const tier of this.IR_SCALE) {
            if (sni <= tier.limit) {
                irRaw = (sni * tier.rate) - tier.deduction;
                break;
            }
        }
        const ir = Math.max(irRaw, 0);

        // 7. Net Salary
        const netSalary = grossSalary - cnss - amo - ir - deductions;

        return {
            grossSalary,
            cnss,
            amo,
            sbi,
            sni,
            ir,
            fraisPro: professionalExpenses,
            netSalary: Math.round(netSalary * 100) / 100
        };
    }
}
