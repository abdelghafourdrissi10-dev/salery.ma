
import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";
import { ChatMessage, AuthUser, UserRole, Employee, CalendarEvent, OptimizationConstraint } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

const SYSTEM_PROMPT = (role: UserRole, company: string) => `
You are the Unified AI Operating System of Salery.ma for ${company}.
Your role: Moroccan Labor Law Expert (Code du Travail), Payroll & Social Compliance Engine.
Current User Role: ${role}.

STRICT OUTPUT STRUCTURE:
1. ### Title
2. **Résumé exécutif**: Short summary.
3. **Analyse détaillée**: Deep legal logic.
4. **Références légales**: Articles of Code du Travail.
5. **Recommandation opérationnelle**: Clear next steps.

Strict Rules:
- ALWAYS follow Moroccan regulations (SMIG 2026: 3422.72 DH/month, CNSS ceiling: 6000 DH, etc.).
- If a file is provided, analyze its content thoroughly.
- Respond in the language of the user (French or Arabic).
`;

export const streamLegalAdvice = async (
  query: string,
  history: ChatMessage[],
  user: AuthUser,
  onChunk: (text: string) => void,
  file?: { data: string; mimeType: string },
  useThinking: boolean = false
) => {
  const ai = getAIClient();
  const model = useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-pro-preview';

  const contents: any[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const parts: any[] = [{ text: query }];
  if (file) {
    parts.unshift({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType,
      },
    });
  }

  contents.push({ role: 'user', parts });

  try {
    const config: any = {
      systemInstruction: SYSTEM_PROMPT(user.role, user.companyName),
      temperature: useThinking ? 1 : 0.15,
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const result = await ai.models.generateContentStream({
      model,
      contents,
      config
    });

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("AI Stream Error:", error);
    throw error;
  }
};

export const getLegalAdvice = async (query: string, lang: string = 'fr', role: UserRole = 'EMPLOYEE') => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: query,
    config: { systemInstruction: `Expert en droit du travail marocain. Réponds en ${lang}.` }
  });
  return response.text || "";
};

export const draftDocument = async (docType: string, data: any, lang: string) => {
  const ai = getAIClient();
  const prompt = `Rédige un contrat de type ${docType} en ${lang} pour :
    Entreprise : ${JSON.stringify(data.company)}
    Employé : ${JSON.stringify(data.employee)}
    Secteur : ${data.sector}
    Date : ${data.currentDate}
    
    Respecte strictement le Code du Travail marocain. Inclus les clauses obligatoires.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    return response.text || "";
  } catch (error) {
    console.error("Draft Error:", error);
    return "Erreur lors de la rédaction.";
  }
};

export const getPlanRecommendation = async (data: any, lang: string) => {
  const ai = getAIClient();
  const prompt = `Recommande un plan Salery.ma : ${JSON.stringify(data)} en ${lang}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    return "Erreur recommandation.";
  }
};

export const optimizeSchedule = async (
  employees: Employee[],
  currentEvents: CalendarEvent[],
  constraints: OptimizationConstraint
): Promise<CalendarEvent[]> => {
  const ai = getAIClient();
  const prompt = `Optimise planning JSON. Respecte 44h/semaine Maroc. Retourne JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return currentEvents;
  }
};

export const connectLive = (callbacks: any, systemInstruction: string) => {
  const ai = getAIClient();
  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction,
    },
  });
};
