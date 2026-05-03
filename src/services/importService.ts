import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord, Language, CountryCode, AttendanceStatus } from '../types';

export interface ImportResult<T> {
  valid: T[];
  invalid: { row: number; errors: string[]; data: any }[];
  duplicates: number;
}

export const downloadTemplate = (type: 'employees' | 'employees_basic' | 'employees_payroll' | 'employees_full' | 'attendance') => {
  let headers: string[][] = [];
  let fileName = `Salery_${type}_Template.xlsx`;

  if (type === 'employees' || type === 'employees_basic') {
    headers = [['Employee_ID', 'First_Name', 'Last_Name', 'CIN', 'CNSS_Number', 'Position', 'Department', 'Salary_Type', 'Base_Salary', 'Overtime_Rate', 'Hiring_Date', 'Contract_Type']];
    fileName = 'Salery_Basic_Employees_Template.xlsx';
  } else if (type === 'employees_payroll') {
    headers = [['Employee_ID', 'First_Name', 'Last_Name', 'CIN', 'Position', 'Salary_Type', 'Base_Salary', 'Overtime_Rate', 'Payment_Method', 'Bank_Name', 'RIB']];
    fileName = 'Salery_Payroll_Employees_Template.xlsx';
  } else if (type === 'employees_full') {
    headers = [['Employee_ID', 'Civilite', 'First_Name', 'Last_Name', 'CIN', 'CNSS_Number', 'Date_of_Birth', 'Place_of_Birth', 'Nationality', 'Marital_Status', 'Number_of_Children', 'Phone', 'Email', 'Full_Address', 'Position', 'Department', 'Contract_Type', 'Hiring_Date', 'Contract_End_Date', 'Employee_Status', 'Salary_Type', 'Base_Salary', 'Overtime_Rate', 'Payment_Method', 'Bank_Name', 'RIB', 'Emergency_Contact_Name', 'Emergency_Contact_Phone', 'Role']];
    fileName = 'Salery_Full_HR_Master_Data_Template.xlsx';
  } else if (type === 'attendance') {
    headers = [['Employee_ID', 'Date', 'Check_In', 'Check_Out', 'Break_Minutes', 'Justification']];
  }

  const ws = XLSX.utils.aoa_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salery Template");
  XLSX.writeFile(wb, fileName);
};

export const parseAndValidateEmployees = async (
  file: File,
  existingEmployees: Employee[],
  companyId: string,
  country: CountryCode = 'MA'
): Promise<ImportResult<Employee>> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

  const result: ImportResult<Employee> = { valid: [], invalid: [], duplicates: 0 };
  const seenIds = new Set(existingEmployees.map(e => e.internalMatricule));
  const seenCins = new Set(existingEmployees.map(e => e.cin));

  rawData.forEach((row, index) => {
    const errors: string[] = [];
    const rowNum = index + 2; // +1 for 0-index, +1 for header

    if (!row.Employee_ID) errors.push("Employee_ID est requis");
    if (!row.First_Name || !row.Last_Name) errors.push("Nom/Prénom requis");
    if (!row.CIN) errors.push("CIN est requis");
    if (isNaN(Number(row.Base_Salary))) errors.push("Base_Salary doit être numérique");

    // Duplicate checks
    if (seenIds.has(String(row.Employee_ID))) {
      result.duplicates++;
      errors.push(`ID ${row.Employee_ID} existe déjà`);
    }
    if (seenCins.has(String(row.CIN))) {
      errors.push(`CIN ${row.CIN} existe déjà`);
    }

    if (errors.length > 0) {
      result.invalid.push({ row: rowNum, errors, data: row });
    } else {
      const newEmp: Employee = {
        id: `EMP-${Date.now()}-${index}`,
        companyId,
        fullName: `${row.First_Name} ${row.Last_Name}`,
        firstName: row.First_Name,
        lastName: row.Last_Name,
        civility: row.Civilite?.toUpperCase() === 'MR' || row.Civilite?.toUpperCase() === 'MONSIEUR' ? 'MR' :
          row.Civilite?.toUpperCase() === 'MME' || row.Civilite?.toUpperCase() === 'MADAME' ? 'MME' :
            row.Civilite?.toUpperCase() === 'MLLE' || row.Civilite?.toUpperCase() === 'MADEMOISELLE' ? 'MLLE' : undefined,
        cin: String(row.CIN),
        cnssEmployee: row.CNSS_Number ? String(row.CNSS_Number) : undefined,
        internalMatricule: String(row.Employee_ID),
        jobTitle: row.Position || 'Employé',
        department: row.Department,
        employmentStatus: row.Employee_Status?.toLowerCase() === 'resigned' ? 'leaving' :
          row.Employee_Status?.toLowerCase() === 'terminated' ? 'terminated' :
            row.Employee_Status?.toLowerCase() === 'on leave' || row.Employee_Status?.toLowerCase() === 'suspended' ? 'suspended' : 'active',
        hireDate: row.Hiring_Date || new Date().toISOString().split('T')[0],
        contractEndDate: row.Contract_End_Date && row.Contract_End_Date !== 'NULL' ? row.Contract_End_Date : undefined,
        baseSalary: Number(row.Base_Salary),
        salaryType: row.Salary_Type?.toLowerCase() === 'hourly' ? 'hourly' : 'fixed',
        contractType: row.Contract_Type || 'CDI',
        overtimeRate: row.Overtime_Rate ? Number(row.Overtime_Rate) : undefined,
        paymentMethod: row.Payment_Method?.toUpperCase() === 'CASH' ? 'CASH' : 'TRANSFER',
        bankName: row.Bank_Name,
        rib: row.RIB ? String(row.RIB) : undefined,
        email: row.Email || row.Login_Email,
        phoneNumber: row.Phone ? String(row.Phone) : undefined,
        physicalAddress: row.Full_Address,
        dob: row.Date_of_Birth,
        pob: row.Place_of_Birth,
        nationality: row.Nationality,
        maritalStatus: row.Marital_Status?.toLowerCase() === 'married' ? 'married' :
          row.Marital_Status?.toLowerCase() === 'divorced' ? 'divorced' :
            row.Marital_Status?.toLowerCase() === 'widowed' ? 'widowed' : 'single',
        childrenCount: row.Number_of_Children ? Number(row.Number_of_Children) : 0,
        emergencyContactName: row.Emergency_Contact_Name,
        emergencyContactPhone: row.Emergency_Contact_Phone ? String(row.Emergency_Contact_Phone) : undefined,
        country: country
      };
      result.valid.push(newEmp);
      seenIds.add(newEmp.internalMatricule);
      seenCins.add(newEmp.cin);
    }
  });

  return result;
};

export const parseAndValidateAttendance = async (
  file: File,
  employees: Employee[],
  existingAttendance: AttendanceRecord[]
): Promise<ImportResult<AttendanceRecord>> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

  const result: ImportResult<AttendanceRecord> = { valid: [], invalid: [], duplicates: 0 };
  const empMap = new Map(employees.map(e => [e.internalMatricule, e.id]));

  rawData.forEach((row, index) => {
    const errors: string[] = [];
    const rowNum = index + 2;

    const empInternalId = String(row.Employee_ID);
    const empId = empMap.get(empInternalId);

    if (!empId) errors.push(`Employé ID ${empInternalId} non trouvé`);
    if (!row.Date) errors.push("Date est requise");
    if (!row.Check_In || !row.Check_Out) errors.push("Pointage In/Out requis");

    let hoursWorked = 0;
    if (row.Check_In && row.Check_Out) {
      const timeIn = new Date(`${row.Date}T${row.Check_In}`);
      const timeOut = new Date(`${row.Date}T${row.Check_Out}`);
      const breakMinutes = Number(row.Break_Minutes) || 0;

      if (timeOut <= timeIn) {
        errors.push("L'heure de sortie doit être après l'heure d'entrée");
      } else {
        hoursWorked = (timeOut.getTime() - timeIn.getTime()) / 3600000 - (breakMinutes / 60);
        if (hoursWorked > 16) errors.push("ALERTE: Durée supérieure à 16h");
      }
    }

    if (errors.length > 0) {
      result.invalid.push({ row: rowNum, errors, data: row });
    } else {
      // Added comment: status set to 'approved' from extended AttendanceStatus
      const record: AttendanceRecord = {
        id: `ATT-${Date.now()}-${index}`,
        employeeId: empId!,
        date: String(row.Date),
        checkIn: `${row.Date}T${row.Check_In}`,
        checkOut: `${row.Date}T${row.Check_Out}`,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        breakDuration: Number(row.Break_Minutes) || 0,
        status: 'approved',
        riskLevel: hoursWorked > 12 ? 'MEDIUM' : 'LOW',
        type: 'manual',
        manualReason: row.Justification || 'Import Excel',
        history: [],
        gpsTimeline: [],
        lastActionAt: Date.now(),
        validated: true
      };
      result.valid.push(record);
    }
  });

  return result;
};
