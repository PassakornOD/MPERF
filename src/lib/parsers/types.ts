
export interface SarMetric {
  timestamp: Date;
  hostnameId: number;
  // CPU metrics
  usr?: number;
  nice?: number;
  sys?: number;
  wio?: number;
  steal?: number;
  idle?: number;
  // Memory metrics
  memUsed?: number;
  memFree?: number;
}

export interface ISarParser {
  canHandle(header: string): boolean;
  parse(rawContent: string, hostnameId: number, type: 'cpu' | 'mem'): SarMetric[];
}
