-- SALERY.MA V15 - PRODUCTION DATABASE SCHEMA (POSTGRESQL)
-- MULTI-TENANT ISOLATION VIA SCHEMA_PER_TENANT OR ROW_LEVEL_SECURITY

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS & AUTH
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) CHECK (plan_type IN ('STARTER', 'BUSINESS', 'ENTERPRISE')),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    storage_mode VARCHAR(20) DEFAULT 'CLOUD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. HR CORE (Per Tenant)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    internal_matricule VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    cin VARCHAR(20) UNIQUE NOT NULL,
    cnss_number VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    base_salary DECIMAL(15, 2) NOT NULL,
    salary_type VARCHAR(20) DEFAULT 'fixed',
    hire_date DATE NOT NULL,
    employment_status VARCHAR(20) DEFAULT 'active'
);

-- 3. PAYROLL ENGINE V15
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    period_month VARCHAR(7) NOT NULL, -- YYYY-MM
    status VARCHAR(20) DEFAULT 'DRAFT',
    gross_total DECIMAL(18, 2),
    net_total DECIMAL(18, 2),
    ai_validation_score DECIMAL(5, 2),
    created_by UUID REFERENCES public.users(id),
    locked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES payroll_runs(id),
    employee_id UUID REFERENCES employees(id),
    gross_salary DECIMAL(15, 2),
    net_salary DECIMAL(15, 2),
    cnss_deduction DECIMAL(15, 2),
    amo_deduction DECIMAL(15, 2),
    ir_deduction DECIMAL(15, 2),
    hash_signature TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AUTONOMOUS AGENT AUDIT
CREATE TABLE ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id),
    trace_id VARCHAR(100),
    from_agent VARCHAR(50),
    to_agent VARCHAR(50),
    message TEXT,
    payload JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ATTENDANCE & FRAUD
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    fraud_score DECIMAL(5, 2),
    device_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_payslips_run ON payslips(payroll_run_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, clock_in);
