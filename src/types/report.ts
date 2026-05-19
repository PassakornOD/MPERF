export interface MonthlyStat {
  month: number;
  year: number;
  value: string;
}

export interface ChartData {
  label: string;
  data: string; // base64 image data
}

export interface HostData {
  id: string;
  name: string;
  mem?: number;
  cpuStats: MonthlyStat[];
  memStats: MonthlyStat[];
  charts: ChartData[];
}

export interface HostGroupData {
  id: string;
  name: string;
  hosts: HostData[];
}

export interface ReportPayload {
  reportMonth: string;
  targetMonth?: number;
  targetYear?: number;
  generatedDate: string;
  hostgroups: HostGroupData[];
}
