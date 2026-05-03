
import { AuthUser } from "../types";

/**
 * Enterprise AI Audit Trail
 */

export interface AiAuditLog {
  id: string;
  companyId: string;
  userId: string;
  module: string;
  status: 'SUCCESS' | 'BLOCKED_INJECTION' | 'FAILED' | 'REPAIRED';
  model: string;
  timestamp: number;
}

export const logAiTransaction = async (
  user: AuthUser, 
  module: string, 
  status: AiAuditLog['status'],
  model: string
) => {
  const log: AiAuditLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    companyId: user.companyId,
    userId: user.id,
    module,
    status,
    model,
    timestamp: Date.now()
  };

  // Persist to local storage for demo, DB in production
  const saved = localStorage.getItem('salery_ai_audit');
  const logs = saved ? JSON.parse(saved) : [];
  localStorage.setItem('salery_ai_audit', JSON.stringify([log, ...logs].slice(0, 100)));
  
  console.log(`[AI GATEWAY AUDIT] ${status} - User: ${user.email} - Module: ${module}`);
};
