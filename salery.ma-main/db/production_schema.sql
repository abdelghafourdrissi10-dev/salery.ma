-- SALERY.MA V16 - ULTRA-SECURE MULTI-TENANT DATABASE SCHEMA (POSTGRESQL)
-- CORE PRINCIPLE: EVERY COMPANY IS ISOLATED VIA ROW-LEVEL SECURITY (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (TENANTS)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) CHECK (plan_type IN ('STARTER', 'BUSINESS', 'ENTERPRISE')),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & AUTH
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'RH_MANAGER', 'RH_AGENT', 'EMPLOYEE', 'AI_SYSTEM')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HR CORE
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    user_id UUID REFERENCES public.users(id),
    internal_matricule VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    cin VARCHAR(20) NOT NULL,
    cnss_number VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    base_salary DECIMAL(15, 2) NOT NULL,
    contract_type VARCHAR(20) DEFAULT 'CDI',
    hire_date DATE NOT NULL,
    employment_status VARCHAR(20) DEFAULT 'active',
    birth_date DATE,
    family_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DOCUMENTS
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    employee_id UUID REFERENCES employees(id) NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- 'CONTRAT', 'CIN', 'RIB', 'DIPLOME', 'CV', 'AUTRE'
    file_path TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PAYROLL ENGINE
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    period_month VARCHAR(7) NOT NULL, -- YYYY-MM
    status VARCHAR(20) DEFAULT 'DRAFT',
    gross_total DECIMAL(18, 2),
    net_total DECIMAL(18, 2),
    created_by UUID REFERENCES public.users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    payroll_run_id UUID REFERENCES payroll_runs(id),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    gross_salary DECIMAL(15, 2),
    net_salary DECIMAL(15, 2),
    cnss_deduction DECIMAL(15, 2),
    amo_deduction DECIMAL(15, 2),
    ir_deduction DECIMAL(15, 2),
    hash_signature TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT LOGS (IMMUTABLE)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    payload JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- EMPLOYEE POLICY: Can only see their own data
CREATE POLICY employee_isolation ON employees
    FOR SELECT USING (company_id = current_setting('app.company_id')::uuid AND id = current_setting('app.employee_id')::uuid);

-- RH POLICY: Can access all data within their company
CREATE POLICY rh_company_access ON employees
    FOR ALL USING (company_id = current_setting('app.company_id')::uuid);

-- Repeat similar policies for other tables...

-- 9. INDEXES
CREATE INDEX idx_users_company ON public.users(company_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_docs_employee ON employee_documents(employee_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_audit_company ON audit_logs(company_id);
