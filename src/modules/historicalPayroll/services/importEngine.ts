import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoricalRecord {
    id: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    cin: string;
    cnssNumber: string;
    year: number;
    month: number;
    baseSalary: number;
    realSalary: number;
    paidSalary: number;
    overtimeHours: number;
    overtimeRate: number;
    bonus: number;
    transportAllowance: number;
    mealAllowance: number;
    otherAllowances: number;
    absenceDays: number;
    paidLeaveDays: number;
    cnssEmployee: number;
    cnssEmployer: number;
    taxIR: number;
    netSalary: number;
    paymentDate: string;
    // Computed
    difference: number;
    differenceCategory: 'bonus' | 'regularization' | 'allowance' | 'deduction' | 'none';
    grossSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    reconstructionStatus: 'draft' | 'validated' | 'anomaly';
}

export interface ImportResult {
    records: HistoricalRecord[];
    employeeCount: number;
    yearRange: number[];
    totalRecords: number;
    errors: { row: number; message: string }[];
}

// ─── Column name aliases (handles various Excel formats) ──────────────────────

const COL = {
    employeeId: ['employee_id', 'employeeid', 'id_employe', 'matricule'],
    employeeName: ['employee_name', 'nom_employe', 'nom', 'name', 'fullname'],
    cin: ['cin', 'cni', 'id_national'],
    cnssNumber: ['cnss_number', 'num_cnss', 'cnss'],
    year: ['year', 'annee', 'année'],
    month: ['month', 'mois'],
    baseSalary: ['base_salary', 'salaire_base', 'salbase'],
    realSalary: ['real_salary', 'salaire_reel', 'salreel'],
    paidSalary: ['paid_salary', 'salaire_paye', 'salpaye'],
    overtimeHours: ['overtime_hours', 'heures_sup', 'heurssup'],
    overtimeRate: ['overtime_rate', 'taux_hs', 'taux_heures'],
    bonus: ['bonus', 'prime', 'primes'],
    transportAllowance: ['transport_allowance', 'indemnite_transport', 'transport'],
    mealAllowance: ['meal_allowance', 'indemnite_repas', 'repas', 'panier'],
    otherAllowances: ['other_allowances', 'autres_indemnites', 'autres'],
    absenceDays: ['absence_days', 'jours_absence', 'absences'],
    paidLeaveDays: ['paid_leave_days', 'conges_payes', 'conges'],
    cnssEmployee: ['cnss_employee', 'cnss_salarie', 'retenue_cnss'],
    cnssEmployer: ['cnss_employer', 'cnss_patronale', 'cotisation_patronale'],
    taxIR: ['tax_ir', 'ir', 'impot_revenu'],
    netSalary: ['net_salary', 'salaire_net', 'net'],
    paymentDate: ['payment_date', 'date_paiement', 'date_virement'],
};

const findCol = (headers: string[], aliases: string[]): string | null => {
    const h = headers.map(h => h.trim().toLowerCase().replace(/[\s\-]/g, '_'));
    for (const alias of aliases) {
        const idx = h.indexOf(alias);
        if (idx !== -1) return headers[idx];
    }
    return null;
};

const numVal = (row: any, key: string | null): number => {
    if (!key || row[key] === undefined || row[key] === null || row[key] === '') return 0;
    const v = parseFloat(String(row[key]).replace(/[,\s]/g, ''));
    return isNaN(v) ? 0 : v;
};

const strVal = (row: any, key: string | null): string => {
    if (!key || row[key] === undefined) return '';
    return String(row[key]).trim();
};

const classifyDifference = (diff: number): HistoricalRecord['differenceCategory'] => {
    if (diff === 0) return 'none';
    if (diff > 0 && diff < 500) return 'allowance';
    if (diff > 500) return 'bonus';
    if (diff < 0 && diff > -500) return 'deduction';
    return 'regularization';
};

// ─── Main Parser ──────────────────────────────────────────────────────────────

export const parseHistoricalFile = async (
    file: File,
    companyId: string
): Promise<ImportResult> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawData.length === 0) {
        return { records: [], employeeCount: 0, yearRange: [], totalRecords: 0, errors: [{ row: 0, message: 'Fichier vide ou non conforme.' }] };
    }

    const headers = Object.keys(rawData[0]);

    // Map column names
    const cols = {
        employeeId: findCol(headers, COL.employeeId),
        employeeName: findCol(headers, COL.employeeName),
        cin: findCol(headers, COL.cin),
        cnssNumber: findCol(headers, COL.cnssNumber),
        year: findCol(headers, COL.year),
        month: findCol(headers, COL.month),
        baseSalary: findCol(headers, COL.baseSalary),
        realSalary: findCol(headers, COL.realSalary),
        paidSalary: findCol(headers, COL.paidSalary),
        overtimeHours: findCol(headers, COL.overtimeHours),
        overtimeRate: findCol(headers, COL.overtimeRate),
        bonus: findCol(headers, COL.bonus),
        transportAllowance: findCol(headers, COL.transportAllowance),
        mealAllowance: findCol(headers, COL.mealAllowance),
        otherAllowances: findCol(headers, COL.otherAllowances),
        absenceDays: findCol(headers, COL.absenceDays),
        paidLeaveDays: findCol(headers, COL.paidLeaveDays),
        cnssEmployee: findCol(headers, COL.cnssEmployee),
        cnssEmployer: findCol(headers, COL.cnssEmployer),
        taxIR: findCol(headers, COL.taxIR),
        netSalary: findCol(headers, COL.netSalary),
        paymentDate: findCol(headers, COL.paymentDate),
    };

    const records: HistoricalRecord[] = [];
    const errors: { row: number; message: string }[] = [];
    const employeeSet = new Set<string>();
    const yearSet = new Set<number>();

    rawData.forEach((row, i) => {
        const rowNum = i + 2;
        const empId = strVal(row, cols.employeeId);
        const year = parseInt(strVal(row, cols.year)) || new Date().getFullYear();
        const month = parseInt(strVal(row, cols.month)) || 1;

        if (!empId) {
            errors.push({ row: rowNum, message: `Ligne ${rowNum}: employee_id manquant.` });
            return;
        }

        const realSalary = numVal(row, cols.realSalary) || numVal(row, cols.baseSalary);
        const paidSalary = numVal(row, cols.paidSalary) || realSalary;
        const bonus = numVal(row, cols.bonus);
        const transport = numVal(row, cols.transportAllowance);
        const meal = numVal(row, cols.mealAllowance);
        const other = numVal(row, cols.otherAllowances);
        const overtime = numVal(row, cols.overtimeHours) * numVal(row, cols.overtimeRate);
        const totalAllowances = transport + meal + other;
        const grossSalary = realSalary + bonus + totalAllowances + overtime;
        const cnssEmp = numVal(row, cols.cnssEmployee) || +(realSalary * 0.044).toFixed(2);
        const ir = numVal(row, cols.taxIR);
        const totalDeductions = cnssEmp + ir;
        const netSalary = numVal(row, cols.netSalary) || +(grossSalary - totalDeductions).toFixed(2);
        const difference = paidSalary - realSalary;

        employeeSet.add(empId);
        yearSet.add(year);

        records.push({
            id: crypto.randomUUID(),
            companyId,
            employeeId: empId,
            employeeName: strVal(row, cols.employeeName),
            cin: strVal(row, cols.cin),
            cnssNumber: strVal(row, cols.cnssNumber),
            year,
            month,
            baseSalary: numVal(row, cols.baseSalary),
            realSalary,
            paidSalary,
            overtimeHours: numVal(row, cols.overtimeHours),
            overtimeRate: numVal(row, cols.overtimeRate),
            bonus,
            transportAllowance: transport,
            mealAllowance: meal,
            otherAllowances: other,
            absenceDays: numVal(row, cols.absenceDays),
            paidLeaveDays: numVal(row, cols.paidLeaveDays),
            cnssEmployee: cnssEmp,
            cnssEmployer: numVal(row, cols.cnssEmployer) || +(realSalary * 0.2026).toFixed(2),
            taxIR: ir,
            netSalary,
            paymentDate: strVal(row, cols.paymentDate),
            difference,
            differenceCategory: classifyDifference(difference),
            grossSalary: +grossSalary.toFixed(2),
            totalAllowances: +totalAllowances.toFixed(2),
            totalDeductions: +totalDeductions.toFixed(2),
            reconstructionStatus: 'draft',
        });
    });

    return {
        records,
        employeeCount: employeeSet.size,
        yearRange: Array.from(yearSet).sort(),
        totalRecords: records.length,
        errors,
    };
};

// ─── Template Generator ───────────────────────────────────────────────────────

export const downloadHistoricalTemplate = () => {
    const headers = [Object.keys(COL).map(k => k)];
    const sample = [[
        'EMP001', 'Ahmed Benali', 'A123456', '123456789',
        '2024', '1', '8000', '8500', '8500',
        '10', '75', '500', '600', '200', '0',
        '0', '2', '374', '1722.65', '450', '7576', '2024-01-31'
    ]];

    const ws = XLSX.utils.aoa_to_sheet([
        Object.values(COL).map(aliases => aliases[0]),
        sample[0],
    ]);

    // Style header row width
    ws['!cols'] = Array(22).fill({ wch: 18 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salery_Historical_Template');
    XLSX.writeFile(wb, 'Salery_Historical_Payroll_Template.xlsx');
};
