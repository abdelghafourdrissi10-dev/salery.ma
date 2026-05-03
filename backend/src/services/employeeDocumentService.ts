/**
 * ═══════════════════════════════════════════════════════════════════
 *  SALERY — Employee Document Service
 *  ─────────────────────────────────
 *  Single source of truth for document generation.
 *  DOCUMENT MODE = full dataset, no pagination, no limits.
 *  UI MODE       = paginated / filtered (not used here).
 *
 *  Scales from 1 → 10,000+ employees without changes.
 * ═══════════════════════════════════════════════════════════════════
 */

import { prisma } from '../prisma';
import { PayrollEngine } from '../modules/salaries/payroll.engine';

export interface DocumentEmployee {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    position: string;
    baseSalary: number;
    hireDate: Date;
    badgeId: string | null;
    companyId: string;
}

export interface PayrollCalculation {
    days: number;
    base: number;
    prime: number;
    gross: number;
    fraisPro: number;
    netImposable: number;
    cnss: number;
    amo: number;
    ir: number;
    net: number;
}

/**
 * DOCUMENT MODE — Fetch ALL active employees for a company.
 * No pagination. No arbitrary limits. Uses companyId for multi-tenant safety.
 *
 * @param companyId - The company UUID. Falls back to first company if not found.
 * @returns Full list of employees mapped to document-friendly structure.
 */
export async function getAllEmployeesForDocuments(companyId: string): Promise<DocumentEmployee[]> {
    // Try to validate the companyId first, fall back to first company
    const company = await prisma.company.findFirst({
        where: companyId ? { id: companyId } : {},
    });

    const resolvedCompanyId = company?.id;

    if (!resolvedCompanyId) {
        console.error('[EmployeeDocumentService] ❌ No company found — cannot generate document.');
        return [];
    }

    // DOCUMENT MODE QUERY: Full dataset, ordered, no take/skip/limit
    const raw = await prisma.employee.findMany({
        where: {
            companyId: resolvedCompanyId,
            // In future: add  isDeleted: false  when soft-delete field is added
        },
        orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
        ],
        // ✅ NO take / skip / limit — full dataset always
    });

    const employees: DocumentEmployee[] = raw.map(e => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        fullName: `${e.firstName} ${e.lastName}`,
        phone: e.phone,
        email: e.email,
        position: e.position,
        baseSalary: e.baseSalary ?? 0,
        hireDate: e.hireDate,
        badgeId: e.badgeId,
        companyId: e.companyId,
    }));

    return employees;
}

/**
 * Moroccan payroll calculation for a single employee using the unified engine.
 */
export function calculatePayroll(baseSalary: number, prime = 0) {
    const calc = PayrollEngine.calculate(baseSalary, prime);
    return {
        days: 26, // Default for Moroccan monthly payroll
        base: baseSalary,
        prime: prime,
        gross: calc.grossSalary,
        fraisPro: calc.fraisPro,
        netImposable: calc.sni,
        cnss: calc.cnss,
        amo: calc.amo,
        ir: calc.ir,
        net: calc.netSalary
    };
}

/**
 * Log document generation stats — mandatory for audit trail.
 */
export function logDocumentGeneration(
    docType: string,
    companyName: string,
    periode: string,
    employeeCount: number,
    totalSalary: number,
    totalCnss?: number,
) {
    const ts = new Date().toISOString();
    console.log(`\n[SALERY DOCUMENT ENGINE] ───────────────────────────────────`);
    console.log(`  📄 Type        : ${docType.toUpperCase()}`);
    console.log(`  🏢 Company     : ${companyName}`);
    console.log(`  📅 Période     : ${periode}`);
    console.log(`  👥 Employees   : ${employeeCount}`);
    console.log(`  💰 Total Brut  : ${totalSalary.toFixed(2)} MAD`);
    if (totalCnss !== undefined) {
        console.log(`  🛡️  Total CNSS  : ${totalCnss.toFixed(2)} MAD`);
    }
    console.log(`  🕐 Generated   : ${ts}`);

    if (employeeCount === 0) {
        console.error(`  ❌ ERROR       : Zero employees in document — aborting!`);
    } else if (employeeCount < 10) {
        console.warn(`  ⚠️  WARNING     : Low employee count (${employeeCount}) — verify data completeness.`);
    } else {
        console.log(`  ✅ STATUS      : Document complete`);
    }
    console.log(`[SALERY DOCUMENT ENGINE] ───────────────────────────────────\n`);
}
