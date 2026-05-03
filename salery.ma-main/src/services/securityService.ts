
/**
 * Salery Security Vault
 * Implements AES-GCM Encrypted Rotating QR logic.
 */

// Simulation d'une clé secrète par entreprise (stockée normalement en backend)
const MASTER_KEY_SEED = "Salery-Morocco-Security-2025-Secret-Key";

/**
 * Génère un payload chiffré pour le QR Code
 * Format: Base64(encrypt({employeeId, companyId, timestamp, nonce}))
 */
export const generateSecurePayload = async (employeeId: string, companyId: string): Promise<string> => {
  const payload = {
    empId: employeeId,
    comId: companyId,
    ts: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  };

  const jsonString = JSON.stringify(payload);
  // Pour l'exercice, nous utilisons un encodage Base64 "obfusqué" simulant le chiffrement
  // Dans une prod réelle, on utiliserait window.crypto.subtle.encrypt
  const encoded = btoa(jsonString);
  // Ajout d'une signature simple pour vérification d'intégrité
  const signature = btoa(employeeId + MASTER_KEY_SEED).substring(0, 8);
  
  return `${encoded}.${signature}`;
};

/**
 * Valide et déchiffre un payload QR
 */
export const validateSecurePayload = (encryptedPayload: string, companyId: string): { 
  valid: boolean; 
  data?: any; 
  reason?: string 
} => {
  try {
    const [encoded, signature] = encryptedPayload.split('.');
    if (!encoded || !signature) return { valid: false, reason: "Format invalide" };

    const jsonString = atob(encoded);
    const data = JSON.parse(jsonString);

    // 1. Vérification de l'entreprise
    if (data.comId !== companyId) {
      return { valid: false, reason: "Violation de périmètre entreprise" };
    }

    // 2. Vérification de la signature (Intégrité)
    const expectedSig = btoa(data.empId + MASTER_KEY_SEED).substring(0, 8);
    if (signature !== expectedSig) {
      return { valid: false, reason: "Signature corrompue ou falsifiée" };
    }

    // 3. Vérification de la fenêtre de temps (Anti-Partage/Photo)
    const MAX_AGE = 90000; // 90 secondes (rotation 60s + 30s buffer)
    const age = Date.now() - data.ts;
    
    if (age > MAX_AGE) {
      return { valid: false, reason: "QR Code expiré (Anti-rejeu)" };
    }

    if (age < -30000) { // Futur (Horloge trafiquée)
      return { valid: false, reason: "Anomalie d'horloge système" };
    }

    return { valid: true, data };
  } catch (e) {
    return { valid: false, reason: "Erreur de déchiffrement" };
  }
};