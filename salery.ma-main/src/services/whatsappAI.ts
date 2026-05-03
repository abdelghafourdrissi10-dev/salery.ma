
import { GoogleGenAI } from "@google/genai";
import { Employee, PayrollResult } from "../types";

/**
 * SALERY WHATSAPP AI BRIDGE
 * Handles asynchronous text-based HR queries.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const handleWhatsAppQuery = async (
  query: string, 
  employee: Employee, 
  lastPayroll: PayrollResult | null
) => {
  const context = {
    empName: employee.fullName,
    salary: lastPayroll?.netSalary,
    leaveBalance: 18.5, // Mock data
    period: lastPayroll?.month
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Employee Query: "${query}"\nContext: ${JSON.stringify(context)}`,
    config: {
      systemInstruction: "You are the Salery.ma WhatsApp Bot. Respond in Moroccan Darija if the user uses Darija. Otherwise French. Be precise and professional about payroll data."
    }
  });

  return response.text || "Sme7li, ma fhemthach. 3awd swwelni men b3d.";
};
