
import { GoogleGenAI, Type } from "@google/genai";
import { OcrExtractionResult } from "../types";

/**
 * SALERY AUTONOMOUS OCR ENGINE
 * Extracts data from identity cards and legal documents.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDocumentData = async (base64Image: string, mimeType: string): Promise<OcrExtractionResult> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Fast vision for OCR
    contents: {
      parts: [
        imagePart,
        { text: "Extract Moroccan identity (CIN) or Contract details. JSON format with fullName, idNumber, cnssNumber, salary, startDate, jobTitle. Confidence score included." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          docType: { type: Type.STRING },
          fullName: { type: Type.STRING },
          idNumber: { type: Type.STRING },
          cnssNumber: { type: Type.STRING },
          salary: { type: Type.NUMBER },
          startDate: { type: Type.STRING },
          jobTitle: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');

  return {
    docType: parsed.docType || 'CIN',
    extractedData: {
      fullName: parsed.fullName,
      idNumber: parsed.idNumber,
      cnssNumber: parsed.cnssNumber,
      salary: parsed.salary,
      startDate: parsed.startDate,
      jobTitle: parsed.jobTitle,
      confidence: parsed.confidence || 0.9
    },
    rawJson: response.text || ''
  };
};
