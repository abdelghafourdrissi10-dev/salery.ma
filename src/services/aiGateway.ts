
import { GoogleGenAI } from "@google/genai";
import { AuthUser, UserRole } from "../types";

/**
 * SALERY ULTRA ENTERPRISE AI GATEWAY
 * Centralized Orchestration for HR, Payroll, Compliance & Accounting Agents.
 */

export type AiAgentType = 'PAYROLL_VALIDATOR' | 'ACCOUNTING_OFFICER' | 'HR_STRATEGIST' | 'COMPLIANCE_WATCHDOG' | 'CEO_ADVISOR';

interface AgentRequest {
  user: AuthUser;
  agentType: AiAgentType;
  payload: any;
  context?: string;
}

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const queryEnterpriseAgent = async (req: AgentRequest): Promise<string> => {
  const { user, agentType, payload, context } = req;
  const ai = getAIClient();

  const systemInstruction = getAgentSystemInstruction(agentType, user);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Task: ${context || 'Analyze data'}\nData: ${JSON.stringify(payload)}`,
    config: {
      systemInstruction,
      temperature: 0.1, // Higher precision for enterprise data
      responseMimeType: "text/plain"
    }
  });

  return response.text || "AGENT_TIMEOUT";
};

function getAgentSystemInstruction(agent: AiAgentType, user: AuthUser): string {
  const base = `You are an Autonomous Enterprise Agent for Salery.ma, operating in the Moroccan market. 
  Company: ${user.companyName}. Role Context: ${user.role}.
  Strict Rule: Follow Moroccan Labor Law (Code du Travail) and Moroccan General Tax Code (CGI).`;

  switch(agent) {
    case 'PAYROLL_VALIDATOR':
      return `${base}\nTask: Validate payroll runs. Detect ghosts, SMIG violations (3266.10 MAD), and abnormal OT.`;
    case 'ACCOUNTING_OFFICER':
      return `${base}\nTask: Map payroll to PCM (Plan Comptable Marocain). Use accounts 6411, 6451, 4421, 431.`;
    case 'HR_STRATEGIST':
      return `${base}\nTask: Analyze workforce performance and absenteeism risks. Predict turnover.`;
    case 'COMPLIANCE_WATCHDOG':
      return `${base}\nTask: Monitor legal risks. Ensure CNSS compliance and contract validity.`;
    case 'CEO_ADVISOR':
      return `${base}\nTask: Provide high-level executive summaries, cost projections, and strategic HR advice.`;
    default:
      return base;
  }
}
