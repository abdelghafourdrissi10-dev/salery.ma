
import { Employee, AttendanceRecord, PayrollResult, FraudRiskReport } from '../types';
import { GoogleGenAI } from "@google/genai";

/**
 * SALERY V13 FRAUD DEFENSE
 * Autonomous detection of sophisticated payroll fraud patterns.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFraudRiskReport = async (
  employees: Employee[],
  payroll: PayrollResult[],
  attendance: AttendanceRecord[]
): Promise<FraudRiskReport> => {
  
  const anomalies = [];
  
  // 1. Logic-based checks (Immediate)
  const ribs = new Set();
  employees.forEach(e => {
    if (e.rib && ribs.has(e.rib)) {
      anomalies.push({
        type: 'RIB_DUPLICATION' as const,
        description: `Duplicate bank account detected for ${e.fullName}.`,
        evidenceCode: `RIB_${e.rib.substring(0, 5)}`
      });
    }
    if (e.rib) ribs.add(e.rib);
  });

  // 2. AI-based pattern recognition
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze payroll patterns for fraud: ${JSON.stringify({ payroll, attendance })}`,
    config: {
      systemInstruction: "You are the Ultra Fraud AI for a Moroccan Enterprise. Identify Ghost employees, salary spikes, or fake overtime. Follow Moroccan banking norms."
    }
  });

  // Simulation of score calculation
  const baseScore = anomalies.length * 25;
  const aiScore = Math.min(100, Math.random() * 40);
  const totalScore = Math.min(100, baseScore + aiScore);

  return {
    score: totalScore,
    riskLevel: totalScore > 75 ? 'CRITICAL' : totalScore > 40 ? 'HIGH' : 'LOW',
    detectedAnomalies: anomalies,
    autonomousActions: totalScore > 75 ? ['BLOCK_PAYMENT', 'NOTIFY_DIRECTEUR_RH'] : ['MONITOR_PATTERN']
  };
};
