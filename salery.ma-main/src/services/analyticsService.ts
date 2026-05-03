import { SaaSAnalyticsData, Subscription, SubscriptionEvent, PlanType } from '../types';

/**
 * MOCK DATA GENERATOR
 */
const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub_1', customerId: 'c1', customerName: 'Atlas Corp', planId: 'STARTER', amount: 999, interval: 'month', status: 'active', currentPeriodEnd: '2025-12-01', createdAt: '2024-01-01' },
  { id: 'sub_2', customerId: 'c2', customerName: 'Casa Logistics', planId: 'BUSINESS', amount: 4990, interval: 'month', status: 'active', currentPeriodEnd: '2025-12-05', createdAt: '2024-03-15' },
  { id: 'sub_3', customerId: 'c3', customerName: 'Rabat IT', planId: 'ENTERPRISE', amount: 19990, interval: 'month', status: 'active', currentPeriodEnd: '2025-12-10', createdAt: '2024-05-20' },
  { id: 'sub_4', customerId: 'c4', customerName: 'Tangier Port', planId: 'BUSINESS', amount: 50898, interval: 'year', status: 'active', currentPeriodEnd: '2026-06-01', createdAt: '2024-06-10' },
  { id: 'sub_5', customerId: 'c5', customerName: 'Marrakech Hotel', planId: 'STARTER', amount: 10789, interval: 'year', status: 'active', currentPeriodEnd: '2026-08-15', createdAt: '2024-08-20' },
  { id: 'sub_6', customerId: 'c6', customerName: 'Fez Textiles', planId: 'STARTER', amount: 999, interval: 'month', status: 'active', currentPeriodEnd: '2025-11-20', createdAt: '2024-09-01' },
  { id: 'sub_7', customerId: 'c7', customerName: 'Agadir Fish', planId: 'BUSINESS', amount: 4990, interval: 'month', status: 'active', currentPeriodEnd: '2025-11-30', createdAt: '2024-10-10' },
];

const MOCK_EVENTS: SubscriptionEvent[] = [
  { id: 'e1', subscriptionId: 'sub_1', type: 'new', mrrDelta: 999, timestamp: '2025-11-01T10:00:00Z' },
  { id: 'e2', subscriptionId: 'sub_2', type: 'expansion', mrrDelta: 3991, timestamp: '2025-11-05T14:00:00Z' },
  { id: 'e3', subscriptionId: 'sub_x', type: 'churn', mrrDelta: -999, timestamp: '2025-11-10T09:00:00Z' },
  { id: 'e4', subscriptionId: 'sub_y', type: 'contraction', mrrDelta: -1000, timestamp: '2025-11-15T11:00:00Z' },
];

/**
 * SAAS ANALYTICS ENGINE
 */
export const calculateSaaSAnalytics = (): SaaSAnalyticsData => {
  const activeSubs = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'active');
  
  // 1. Calculate Total MRR
  const totalMrr = activeSubs.reduce((acc, sub) => {
    const subMrr = sub.interval === 'year' ? sub.amount / 12 : sub.amount;
    return acc + subMrr;
  }, 0);

  // 2. Breakdown Movements (Current Period)
  const movement = MOCK_EVENTS.reduce((acc, ev) => {
    if (ev.type === 'new') acc.new += ev.mrrDelta;
    if (ev.type === 'expansion') acc.expansion += ev.mrrDelta;
    if (ev.type === 'contraction') acc.contraction += Math.abs(ev.mrrDelta);
    if (ev.type === 'churn') acc.churned += Math.abs(ev.mrrDelta);
    return acc;
  }, { new: 0, expansion: 0, contraction: 0, churned: 0 });

  const netNewMrr = movement.new + movement.expansion - movement.contraction - movement.churned;

  // 3. Plan Level Breakdown
  // Fix: Added GOVERNMENT_NODE, SOVEREIGN_IDENTITY and CONTINENTAL_OS to planMap to fulfill Record<PlanType, ...> requirement
  const planMap: Record<PlanType, { mrr: number, count: number, pct: number }> = {
    STARTER: { mrr: 0, count: 0, pct: 0 },
    BUSINESS: { mrr: 0, count: 0, pct: 0 },
    ENTERPRISE: { mrr: 0, count: 0, pct: 0 },
    GOVERNMENT_NODE: { mrr: 0, count: 0, pct: 0 },
    SOVEREIGN_IDENTITY: { mrr: 0, count: 0, pct: 0 },
    CONTINENTAL_OS: { mrr: 0, count: 0, pct: 0 }
  };

  activeSubs.forEach(sub => {
    const subMrr = sub.interval === 'year' ? sub.amount / 12 : sub.amount;
    planMap[sub.planId].mrr += subMrr;
    planMap[sub.planId].count += 1;
  });

  Object.keys(planMap).forEach(key => {
    const p = key as PlanType;
    planMap[p].pct = totalMrr > 0 ? (planMap[p].mrr / totalMrr) * 100 : 0;
  });

  // 4. KPIs
  const arpa = activeSubs.length > 0 ? totalMrr / activeSubs.length : 0;
  
  // Mock churn calculation for the UI
  const mrrAtStart = totalMrr - netNewMrr;
  const churnRate = mrrAtStart > 0 ? (movement.churned / mrrAtStart) * 100 : 0;

  return {
    mrr: {
      total: totalMrr,
      new: movement.new,
      expansion: movement.expansion,
      contraction: movement.contraction,
      churned: movement.churned,
      netNew: netNewMrr
    },
    arr: {
      total: totalMrr * 12,
      new: movement.new * 12,
      expansion: movement.expansion * 12,
      contraction: movement.contraction * 12,
      churned: movement.churned * 12
    },
    kpis: {
      churnRate: churnRate,
      retentionRate: 100 - churnRate,
      arpa: arpa,
      activeCount: activeSubs.length
    },
    planBreakdown: planMap
  };
};
