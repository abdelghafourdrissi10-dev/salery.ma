import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../store/store';
import { calculateEmployeePayroll } from '../services/payrollEngine';
import PayslipPDF from '../components/PayslipPDF';
import { Employee, CompanyProfile, AttendanceRecord } from '../types';

const PrintPayslip: React.FC = () => {
    const { employeeId, month } = useParams<{ employeeId: string, month: string }>();
    const { employees, lang } = useAppStore();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [ready, setReady] = useState(false);

    const company: CompanyProfile = useMemo(() => {
        const saved = localStorage.getItem('salaire_company_profile');
        return saved ? JSON.parse(saved) : {
            id: 'COMP-1', name: 'Salery Enterprise MA', physicalAddress: 'Casablanca', city: 'Casablanca', country: 'MA',
            rc: '---', ice: '---', cnssEmployer: '---', settings: { defaultSignatoryName: 'RH Director' }
        };
    }, []);

    const attendance: AttendanceRecord[] = useMemo(() => {
        const saved = localStorage.getItem('salaire_attendance');
        return saved ? JSON.parse(saved) : [];
    }, []);

    useEffect(() => {
        if (employees.length > 0 && employeeId) {
            const emp = employees.find(e => e.id === employeeId);
            if (emp) {
                setEmployee(emp);
                setTimeout(() => setReady(true), 500); // Allow DOM to paint
            }
        }
    }, [employees, employeeId]);

    useEffect(() => {
        if (ready) {
            window.print();
            // Optional: close after print
            // window.onafterprint = () => window.close();
        }
    }, [ready]);

    if (!employee || !month) return null;

    const payrollResult = calculateEmployeePayroll(employee, attendance, [], [], [], month);

    return (
        <div className="bg-white min-h-screen w-full flex justify-center items-start print:block print:bg-white m-0 p-0">
            <PayslipPDF
                company={company}
                employee={employee}
                payroll={payrollResult}
                period={month}
                lang={lang}
            />
        </div>
    );
};

export default PrintPayslip;
