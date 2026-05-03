
/**
 * Salery AI Security Pipeline
 */

/**
 * Detects common prompt injection patterns
 */
export const detectInjection = async (payload: any): Promise<boolean> => {
  const input = JSON.stringify(payload).toLowerCase();
  const forbiddenPatterns = [
    "ignore previous instructions",
    "system prompt",
    "instead of",
    "forget everything",
    "you are now a",
    "bypass"
  ];

  return !forbiddenPatterns.some(pattern => input.includes(pattern));
};

/**
 * Validates and repairs Legal Engine V4 structure
 */
export const validateLegalResponse = (content: string): { isValid: boolean; repairedContent?: string } => {
  const hasStart = content.includes("START_DOCUMENT");
  const hasEnd = content.includes("END_DOCUMENT");

  if (hasStart && hasEnd) return { isValid: true };

  // Repair logic: Try to wrap if tags are missing but content looks okay
  let repaired = content;
  if (!hasStart) repaired = "START_DOCUMENT\n" + repaired;
  if (!hasEnd) repaired = repaired + "\nEND_DOCUMENT";

  return { isValid: false, repairedContent: repaired };
};

export const sanitizePrompt = (text: string): string => {
  // Remove potential script tags or markdown exploits
  return text.replace(/<script.*?>.*?<\/script>/gi, '')
             .replace(/[<>]/g, '');
};
