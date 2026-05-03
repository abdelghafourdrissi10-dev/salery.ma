import * as XLSX from 'xlsx';
import { Employee, MonthlyAttendanceRecord } from '../types';

/**
 * SALERY ATTENDANCE GRID EXPORT/IMPORT SERVICE
 * ─────────────────────────────────────────────────────────────────
 * Handles specialized Excel formatting for the 31-day attendance grid.
 */

/**
 * Export Grid to Excel
 */
export const exportGridToExcel = (
    employees: Employee[],
    days: Date[],
    gridData: Record<string, Record<number, number>>,
    monthLabel: string
) => {
    const headers = ['Employee', 'Matricule', ...days.map(d => d.getDate().toString()), 'Total Hours'];

    const data = employees.map(emp => {
        const rowData: any[] = [emp.fullName, emp.internalMatricule];
        let total = 0;

        days.forEach(d => {
            const hours = gridData[emp.id]?.[d.getDate()] || 0;
            rowData.push(hours || '');
            total += hours;
        });

        rowData.push(total);
        return rowData;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Grid");

    XLSX.writeFile(wb, `Salery_Attendance_Grid_${monthLabel.replace(/\s/g, '_')}.xlsx`);
};

/**
 * Parse Grid Excel Upload
 */
export const parseGridExcel = async (
    file: File,
    employees: Employee[],
    year: number,
    month: number,
    companyId: string
): Promise<MonthlyAttendanceRecord[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) return [];

    const headers = rawData[0];
    const rows = rawData.slice(1);
    const records: MonthlyAttendanceRecord[] = [];

    const empMap = new Map(employees.map(e => [e.internalMatricule, e.id]));

    rows.forEach((row, rowIndex) => {
        const matricule = String(row[1]); // Matricule is col 2
        const employeeId = empMap.get(matricule);

        if (!employeeId) return;

        // Days start from col 3 (index 2)
        for (let i = 2; i < row.length - 1; i++) {
            const day = parseInt(headers[i]);
            const hours = parseFloat(row[i]) || 0;

            if (day >= 1 && day <= 31 && hours > 0) {
                records.push({
                    id: `grid-import-${employeeId}-${year}-${month}-${day}`,
                    companyId,
                    employeeId,
                    year,
                    month,
                    day,
                    hoursWorked: hours
                });
            }
        }
    });

    return records;
};

/**
 * Trigger PDF Print
 */
export const printGrid = () => {
    window.print();
};
