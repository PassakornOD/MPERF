export interface MonthlyStat {
  month: number;
  year: number;
  value: string;
}

export interface ChartData {
  label: string;
  data?: string; // base64 image data (optional for SSR)
  metrics?: any[];
  report?: any;
  totalAvg?: number;
  hostname?: string;
  hostMem?: number;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
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
  reportTitle?: string;
  targetMonth?: number;
  targetYear?: number;
  generatedDate: string;
  hostgroups: HostGroupData[];
}

export interface HostGroup {
  hostgroup_id: number;
  hostgroup: string;
}

export interface Hostname {
  hostname_id: number;
  hostname: string;
  hostgroup_id: number;
}
