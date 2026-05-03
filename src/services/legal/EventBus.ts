import { LegalEvent, LegalEventType, LegalEventSubscriber, LegalSeverity } from "../../types";

/**
 * SALERY V17 LEGAL EVENT BUS
 * Central nervous system for asynchronous legal notifications and compliance triggers.
 */
export class LegalEventBus {
  private static instance: LegalEventBus;
  private subscribers: Map<LegalEventType, LegalEventSubscriber[]> = new Map();
  private eventLog: LegalEvent[] = [];

  private constructor() {}

  public static getInstance(): LegalEventBus {
    if (!LegalEventBus.instance) {
      LegalEventBus.instance = new LegalEventBus();
    }
    return LegalEventBus.instance;
  }

  /**
   * PUBLISH A LEGAL EVENT
   */
  public async publish(
    tenantId: string,
    type: LegalEventType,
    severity: LegalSeverity,
    source: string,
    payload: any,
    traceId: string = `TRC-EB-${Date.now()}`
  ): Promise<void> {
    const event: LegalEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tenantId,
      type,
      severity,
      source,
      payload,
      timestamp: Date.now(),
      traceId
    };

    console.log(`[EVENT_BUS] Publishing ${type} from ${source}...`);
    this.eventLog.push(event);

    // Persist event to local history (Simulation)
    const saved = localStorage.getItem('salery_legal_event_log');
    const logs = saved ? JSON.parse(saved) : [];
    localStorage.setItem('salery_legal_event_log', JSON.stringify([event, ...logs].slice(0, 100)));

    // Notify Subscribers
    const typeSubscribers = this.subscribers.get(type) || [];
    const allSubscribers = this.subscribers.get('*' as LegalEventType) || [];
    
    const notifications = [...typeSubscribers, ...allSubscribers].map(sub => sub(event));
    await Promise.all(notifications);
  }

  /**
   * SUBSCRIBE TO EVENTS
   */
  public subscribe(type: LegalEventType | '*', callback: LegalEventSubscriber): void {
    const subs = this.subscribers.get(type as LegalEventType) || [];
    this.subscribers.set(type as LegalEventType, [...subs, callback]);
    console.log(`[EVENT_BUS] New subscriber registered for ${type}`);
  }

  public getRecentEvents(): LegalEvent[] {
    return this.eventLog;
  }
}
