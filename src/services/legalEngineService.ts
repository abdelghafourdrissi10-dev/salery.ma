
/**
 * Salery Legal Engine V4 - Security & Certification Service
 */

/**
 * Generates a SHA-256 hash of the document content to ensure immutability.
 */
export const generateDocumentHash = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Creates a unique verification token for the QR system.
 */
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Constructs the verification URL that the QR code points to.
 */
export const getVerificationUrl = (docId: string, token: string): string => {
  return `https://verify.salery.ma/v4/doc?id=${docId}&token=${token}`;
};

/**
 * Validates a document against its stored hash.
 */
export const verifyIntegrity = async (currentContent: string, storedHash: string): Promise<boolean> => {
  const currentHash = await generateDocumentHash(currentContent);
  return currentHash === storedHash;
};

/**
 * Simulates a blockchain anchor or secure audit trail entry.
 */
export const anchorDocumentToRegistry = async (docId: string, hash: string) => {
  console.log(`[LEGAL ENGINE V4] Anchoring Doc ${docId} with Hash ${hash}`);
  // In production, this would be a POST to a secure backend / blockchain
  return true;
};
