
import { AiDecision, SystemHealth, MicroserviceHealth } from '../types';

/**
 * SALERY V10 SUPREME PRODUCTION SIMULATOR
 * Simule la dorsale technique (FastAPI / Kafka / Microservices)
 */

export const getSystemHealth = (): SystemHealth => ({
  status: 'optimal',
  uptime: '242d 14h 22m',
  latency: 42,
  kafkaLag: 0,
  activeMicroservices: 12,
  services: [
    { name: 'Auth Bridge', status: 'online', latency: 12 },
    { name: 'Payroll Engine', status: 'online', latency: 45 },
    { name: 'Fraud AI', status: 'online', latency: 110 },
    { name: 'Accounting Ledger', status: 'online', latency: 32 }
  ],
  lastSnapshot: new Date().toISOString()
});

export const requestAiDecision = async (
  module: AiDecision['module'], 
  payload: any
): Promise<AiDecision> => {
  await new Promise(r => setTimeout(r, 1200));

  const eventTrail = [
    `${module}.initiate`,
    'tenant.context.verify',
    'validation.schema.ok',
    'logic.engine.compute',
    'event.publish.success'
  ];

  return {
    id: `DEC-V10-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    module,
    inputHash: btoa(JSON.stringify(payload)).substring(0, 16),
    decision: 'APPROVED',
    reasoning: {
      fr: "Conformité totale détectée. Les calculs respectent le Code du Travail (SMIG, Heures Sup) et les barèmes IR 2026.",
      ar: "تم الكشف عن الامتثال التام. الحسابات تحترم مدونة الشغل وجداول الضريبة على الدخل 2026.",
      technical: "Vector score: 0.98. Zero drift detected in payroll pattern. PCM Accounts mapped: 6411, 4421."
    },
    riskScore: 2,
    timestamp: Date.now(),
    model: 'gemini-3-pro-v10-supreme',
    eventTrail
  };
};

export const simulateKafkaFlow = (callback: (event: string) => void) => {
  const flow = [
    "📥 ingress.payload.received",
    "⚙️ microservice.payroll.start",
    "🛡️ microservice.fraud.scan",
    "📊 microservice.accounting.map",
    "📑 event.stream.validated",
    "✅ process.complete"
  ];
  flow.forEach((msg, i) => setTimeout(() => callback(msg), i * 600));
};
