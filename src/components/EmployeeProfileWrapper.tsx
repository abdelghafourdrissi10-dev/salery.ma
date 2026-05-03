import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmployeeProfile from './EmployeeProfile';
import { Employee, AuthUser } from '../types';

interface EmployeeProfileWrapperProps {
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    lang: any;
    user: AuthUser;
}

const EmployeeProfileWrapper: React.FC<EmployeeProfileWrapperProps> = ({ employees, setEmployees, lang, user }) => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();

    const employee = employees.find(e => e.id === employeeId);

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Employé introuvable</h2>
                <button
                    onClick={() => navigate('/rh/emps')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="h-full">
            <EmployeeProfile
                employee={employee}
                onClose={() => navigate('/rh/emps')}
                onUpdate={(updatedEmp) => {
                    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
                    // Optional: persist to localStorage for Local Demo Mode
                    const currentAll = JSON.parse(localStorage.getItem('salaire_employees') || '[]');
                    const newAll = currentAll.map((e: any) => e.id === updatedEmp.id ? updatedEmp : e);
                    localStorage.setItem('salaire_employees', JSON.stringify(newAll));
                }}
                lang={lang}
                user={user}
            />
        </div>
    );
};

export default EmployeeProfileWrapper;
