
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * SALERY VOICE HR COPILOT
 * Real-time voice interaction for Moroccan employees.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const startVoiceSession = async (stream: MediaStream, lang: 'DARIJA' | 'FRENCH') => {
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log("Voice session opened"),
      onmessage: async (msg) => {
        // Handle model speech output
        const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audio) {
           // Playback logic...
        }
      },
      onerror: (e) => console.error("Voice Error", e),
      onclose: () => console.log("Voice session closed")
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      },
      systemInstruction: `You are the Voice HR Assistant for Salery.ma. 
      You speak fluent ${lang === 'DARIJA' ? 'Moroccan Arabic (Darija)' : 'French'}.
      Help employees check their salary, request leaves, or explain their payslips.`
    }
  });

  return sessionPromise;
};
