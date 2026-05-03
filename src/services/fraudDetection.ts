
import { AttendanceRecord, Site, FraudSignal, Employee } from '../types';

/**
 * SALAire AI Fraud Detection Engine
 * Analyzes scan metadata to protect payroll integrity.
 */
export const calculateFraudScore = (
  record: Partial<AttendanceRecord>, 
  site: Site, 
  employee: Employee,
  history: AttendanceRecord[]
): { score: number, signals: FraudSignal[], risk: 'LOW' | 'MEDIUM' | 'HIGH' } => {
  let totalScore = 0;
  const signals: FraudSignal[] = [];

  // 1. GPS DISPLACEMENT (Max 40pts)
  // Fixed: isInZone and distanceFromSite usage on Partial<AttendanceRecord>
  if (record.isInZone === false) {
    const dist = record.distanceFromSite || 0;
    const penalty = Math.min(40, Math.floor((dist / 1000) * 10) + 10);
    totalScore += penalty;
    signals.push({ 
      type: 'GPS', 
      score: penalty, 
      description: `Pointage hors-zone (${dist}m).` 
    });
  }

  // 2. DEVICE PROXYING (Max 30pts)
  // Check if same device ID scanned multiple people in a 5min window
  // Fixed: deviceId and lastActionAt usage on AttendanceRecord and Partial<AttendanceRecord>
  const deviceHistory = history.filter(h => 
    h.deviceId === record.deviceId && 
    Math.abs(h.lastActionAt - (record.lastActionAt || 0)) < 300000 &&
    h.employeeId !== record.employeeId
  );
  if (deviceHistory.length >= 2) {
    const penalty = Math.min(30, deviceHistory.length * 10);
    totalScore += penalty;
    signals.push({ 
      type: 'DEVICE', 
      score: penalty, 
      description: `Multi-scan détecté sur cet appareil (${deviceHistory.length + 1} pers).` 
    });
  }

  // 3. TIME ANOMALY (Max 15pts)
  // Rapid Check-in/out
  if (record.checkIn && record.checkOut) {
    const duration = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 3600000;
    if (duration < 1) {
      totalScore += 15;
      signals.push({ 
        type: 'TIME', 
        score: 15, 
        description: `Durée de travail anormalement courte (<1h).` 
      });
    }
  }

  // 4. SYNC DELAY (Max 10pts)
  // Fixed: isOfflineMode and lastActionAt usage on Partial<AttendanceRecord>
  if (record.isOfflineMode) {
    const syncDelayHours = (Date.now() - (record.lastActionAt || 0)) / 3600000;
    if (syncDelayHours > 24) {
      totalScore += 10;
      signals.push({ 
        type: 'SYNC', 
        score: 10, 
        description: `Délai de synchronisation excessif (>24h).` 
      });
    }
  }

  // 5. SITE MISMATCH (Max 5pts)
  if (employee.assignedSite && employee.assignedSite !== site.name) {
    totalScore += 5;
    signals.push({ 
      type: 'PATTERN', 
      score: 5, 
      description: `Affectation incohérente : l'employé est rattaché à ${employee.assignedSite}.` 
    });
  }

  const finalScore = Math.min(100, totalScore);
  const risk = finalScore > 60 ? 'HIGH' : finalScore > 30 ? 'MEDIUM' : 'LOW';

  return { score: finalScore, signals, risk };
};
