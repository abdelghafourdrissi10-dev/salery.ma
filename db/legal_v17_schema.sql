-- SALERY.MA V17 - CORE LEGAL DATABASE SCHEMA

-- 1. LEGAL RULESET (Versioned)
CREATE TABLE legal_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- TAX, LABOR, SOCIAL_SECURITY
    value_json JSONB NOT NULL, -- Thresholds, multipliers
    law_reference TEXT,
    active_from DATE NOT NULL,
    active_to DATE,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. LAW MONITORING LOGS
CREATE TABLE law_updates_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50), -- BULLETIN_OFFICIEL, GOV_API
    raw_content TEXT,
    ai_analysis_json JSONB,
    applied_rules_ids UUID[],
    status VARCHAR(20), -- PENDING_REVIEW, APPLIED, ARCHIVED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MULTI-TENANT COMPLIANCE VIOLATIONS
CREATE TABLE compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID,
    payroll_run_id UUID,
    violation_code VARCHAR(100),
    severity VARCHAR(20),
    evidence_json JSONB,
    status VARCHAR(20) DEFAULT 'OPEN',
    remediation_log TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CONTRACT INTELLIGENCE
CREATE TABLE contract_ai_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type VARCHAR(50),
    sector VARCHAR(50),
    mandatory_clauses_ids UUID[],
    risk_score_baseline INT,
    last_legal_review TIMESTAMP
);

-- 5. INSPECTION SCORES (Historical)
CREATE TABLE inspection_readiness_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    score_json JSONB,
    overall_risk VARCHAR(20),
    improvement_plan TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_rules_active ON legal_rules(active_from, active_to) WHERE is_active = TRUE;
CREATE INDEX idx_violations_tenant ON compliance_violations(tenant_id, status);
CREATE INDEX idx_inspection_tenant ON inspection_readiness_history(tenant_id);
