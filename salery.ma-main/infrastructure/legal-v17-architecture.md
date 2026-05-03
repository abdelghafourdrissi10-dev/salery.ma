# SALERY.MA V17 - AUTONOMOUS LEGAL AI ENGINE ARCHITECTURE

## 📂 System Directory Structure

```text
salery-legal-os/
├── services/
│   ├── law-monitor-service/           # Scrapes B.O. (Bulletin Officiel) & Gov APIs
│   ├── compliance-engine/             # Real-time payroll & HR validation
│   ├── contract-ai-service/           # Generative legal document engine
│   ├── gov-connector-hub/             # Damancom (CNSS) & Simplis (DGI) bridges
│   ├── inspection-risk-service/       # AI Auditor for Labor Inspection prep
│   └── simulation-oracle/             # Legal/Financial impact forecasting
├── agents/
│   ├── agent-monitor.ts               # Law change detection logic
│   ├── agent-validator.ts             # Payroll legal rule enforcement
│   └── agent-drafter.ts               # Clause-based contract generation
├── integration/
│   ├── damancom_v16_client.ts         # CNSS EDI Implementation
│   ├── simplis_v4_client.ts           # DGI XML Schema V4.2
│   └── telepay_bridge.ts              # Gov Payment Gateway API
├── lib/
│   ├── pcm-mapper.ts                  # Moroccan Accounting Standard (Plan Comptable)
│   └── labor-code-rules.ts            # Versioned Code du Travail logic
└── k8s/
    ├── legal-ai-deployment.yaml       # Scaling & Resource Quotas
    └── legal-event-bus.yaml           # NATS/Kafka Stream Definition
```

## 🏗️ Microservice Definitions

1.  **Law Monitor (LCM):** Autonomous agent using Gemini-3-Pro to parse Moroccan legislative updates (Bulletin Officiel).
2.  **Compliance Engine (V17):** High-throughput validator enforcing SMIG, OT limits, and CNSS ceilings.
3.  **Contract AI Builder:** Template-less generative drafter that injects mandatory legal clauses based on sector.
4.  **Inspection Oracle:** Simulates a "Visite de l'Inspecteur du Travail" and produces a gap analysis.
```