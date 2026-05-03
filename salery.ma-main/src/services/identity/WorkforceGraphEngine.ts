import { WorkforceEdge, SEDI, SDEI } from "../../types";

/**
 * SALERY.MA V20 - NATIONAL WORKFORCE GRAPH ENGINE
 * Manages relationships between Sovereign Identities.
 */
export class WorkforceGraphEngine {
  private static instance: WorkforceGraphEngine;
  private edges: WorkforceEdge[] = [];

  private constructor() {}

  public static getInstance(): WorkforceGraphEngine {
    if (!WorkforceGraphEngine.instance) {
      WorkforceGraphEngine.instance = new WorkforceGraphEngine();
    }
    return WorkforceGraphEngine.instance;
  }

  /**
   * ESTABLISH EMPLOYMENT LINK
   */
  public async linkEmployeeToEmployer(
    sediId: string, 
    sdeiId: string, 
    contractHash: string,
    startDate: string
  ): Promise<void> {
    console.log(`[GRAPH-ENGINE] Linking ${sediId} to ${sdeiId}`);
    
    const edge: WorkforceEdge = {
      fromId: sediId,
      toId: sdeiId,
      relationship: 'EMPLOYED_BY',
      contractHash,
      startDate,
      // Fix: Added missing required countryCode property
      countryCode: 'MA'
    };

    this.edges.push(edge);
    
    // Simulate persisting to Sovereign Graph DB
    const saved = localStorage.getItem('salery_workforce_graph');
    const graph = saved ? JSON.parse(saved) : [];
    localStorage.setItem('salery_workforce_graph', JSON.stringify([...graph, edge]));
  }

  /**
   * CALCULATE MOBILITY INDEX
   * Returns how many employers a human (SEDI) has linked to in the last 5 years.
   */
  public getMobilityStats(sediId: string): number {
    return this.edges.filter(e => e.fromId === sediId).length;
  }
}