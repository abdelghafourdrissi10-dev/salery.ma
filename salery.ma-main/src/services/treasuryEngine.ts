import { TreasuryState, BankAccount, PayrollResult, FinancialRiskScore } from '../types';

/**
 * SALERY V22 - AUTONOMOUS TREASURY ENGINE
 * Intelligence layer for cashflow monitoring and salary funding.
 */
export class TreasuryEngine {
  private static instance: TreasuryEngine;

  private constructor() {}

  public static getInstance(): TreasuryEngine {
    if (!TreasuryEngine.instance) {
      TreasuryEngine.instance = new TreasuryEngine();
    }
    return TreasuryEngine.instance;
  }

  /**
   * CALCULATES COMPLETE TREASURY STATE
   */
  public calculateCurrentState(
    accounts: BankAccount[],
    payroll: PayrollResult[]
  ): TreasuryState {
    const totalLiquidity = accounts.reduce((acc, a) => acc + a.balance, 0);
    const upcomingPayroll = payroll.reduce((acc, p) => acc + p.netSalary, 0);
    const upcomingCnss = payroll.reduce((acc, p) => acc + (p.cnss + p.employerCharges.cnss), 0);
    const upcomingTax = payroll.reduce((acc, p) => acc + p.ir, 0);
    
    const totalLiability = upcomingPayroll + upcomingCnss + upcomingTax;
    const fundingGap = Math.max(0, totalLiability - totalLiquidity);

    // Dynamic Burn Rate Simulation (30-day window)
    const dailyOpEx = totalLiquidity / 60; // Mock assumption
    const salaryRunway = totalLiquidity / (upcomingPayroll / 30 || 1);

    const risk = this.assessRisk(totalLiquidity, totalLiability);

    return {
      totalLiquidity,
      salaryRunwayDays: Math.floor(salaryRunway),
      upcomingPayrollLiability: upcomingPayroll,
      cnssLiability: upcomingCnss,
      // Fix: Added missing required cmirLiability property
      cmirLiability: upcomingCnss * 0.15,
      taxLiability: upcomingTax,
      accounts,
      fundingGap,
      riskScore: risk
    };
  }

  /**
   * FINANCIAL RISK SCORING MODEL
   */
  private assessRisk(liquidity: number, liability: number): FinancialRiskScore {
    const ratio = liquidity / liability;
    
    let score: FinancialRiskScore = {
      liquidity: Math.min(100, (1 - ratio) * 100),
      payrollDelay: ratio < 1 ? 80 : 5,
      complianceRisk: ratio < 1.2 ? 40 : 10,
      // Fix: Added missing required pensionRisk property
      pensionRisk: ratio < 1.1 ? 30 : 5,
      status: 'OPTIMAL'
    };

    if (ratio < 1) score.status = 'CRITICAL';
    else if (ratio < 1.3) score.status = 'WARNING';

    return score;
  }

  /**
   * PREDICT FUNDING NEEDS (15 DAYS PRE-SALARY)
   */
  public async getFundingAdvice(state: TreasuryState): Promise<string> {
    if (state.fundingGap > 0) {
      return `CRITICAL: Shortage of ${state.fundingGap.toLocaleString()} MAD detected for upcoming payroll. Suggest partial liquidation or credit line activation.`;
    }
    if (state.riskScore.status === 'WARNING') {
      return `WARNING: Liquidity buffer is below 30%. Advise pausing non-critical vendor payments until salary distribution.`;
    }
    return `OPTIMAL: Treasury fully funded for current cycle. 1.3x coverage confirmed.`;
  }
}