import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, LeaveRequest, AttendanceRecord, AuthUser, Candidate, JobPosting, Company } from '../types.ts';

interface AppState {
    // --- Core State ---
    user: AuthUser | null;
    company: Company | null;
    employees: Employee[];
    leaves: LeaveRequest[];
    attendance: AttendanceRecord[];
    candidates: Candidate[];
    jobPostings: JobPosting[];

    // --- Auth & Redirection (Zero-Trust) ---
    authLoading: boolean;
    isAuthenticated: boolean;
    authError: string | null;

    // --- Actions ---
    setUser: (user: AuthUser | null) => void;
    setCompany: (company: Company | null) => void;
    setEmployees: (employees: Employee[] | ((prev: Employee[]) => Employee[])) => void;
    setLeaves: (leaves: LeaveRequest[] | ((prev: LeaveRequest[]) => LeaveRequest[])) => void;
    setAttendance: (attendance: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => void;
    setCandidates: (candidates: Candidate[] | ((prev: Candidate[]) => Candidate[])) => void;
    setJobPostings: (jobPostings: JobPosting[] | ((prev: JobPosting[]) => JobPosting[])) => void;
    setAuthStatus: (status: { loading?: boolean; authenticated?: boolean; error?: string | null }) => void;

    // --- Logout ---
    logout: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            company: null,
            employees: [],
            leaves: [],
            attendance: [],
            candidates: [],
            jobPostings: [],

            // --- Zero-Trust Init ---
            authLoading: true,
            isAuthenticated: false,
            authError: null,

            setUser: (user) => set({ user }),
            setCompany: (company) => set({ company }),

            setEmployees: (updater) => set((state) => ({
                employees: typeof updater === 'function' ? updater(state.employees) : updater
            })),

            setLeaves: (updater) => set((state) => ({
                leaves: typeof updater === 'function' ? updater(state.leaves) : updater
            })),

            setAttendance: (updater) => set((state) => ({
                attendance: typeof updater === 'function' ? updater(state.attendance) : updater
            })),

            setCandidates: (updater) => set((state) => ({
                candidates: typeof updater === 'function' ? updater(state.candidates) : updater
            })),

            setJobPostings: (updater) => set((state) => ({
                jobPostings: typeof updater === 'function' ? updater(state.jobPostings) : updater
            })),

            setAuthStatus: (status) => set((state) => ({
                authLoading: status.loading !== undefined ? status.loading : state.authLoading,
                isAuthenticated: status.authenticated !== undefined ? status.authenticated : state.isAuthenticated,
                authError: status.error !== undefined ? status.error : state.authError
            })),

            logout: () => set({
                user: null,
                company: null,
                employees: [],
                leaves: [],
                attendance: [],
                candidates: [],
                jobPostings: [],
                isAuthenticated: false,
                authError: null,
            }),
        }),
        {
            name: 'salery-store',
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    return {
                        ...persistedState,
                        user: null,
                        company: null,
                    };
                }
                return persistedState as any;
            },
            partialize: (state) => ({
                user: state.user,
                company: state.company,
                employees: state.employees,
                leaves: state.leaves,
                attendance: state.attendance,
                candidates: state.candidates,
                jobPostings: state.jobPostings,
            }),
        }
    )
);
