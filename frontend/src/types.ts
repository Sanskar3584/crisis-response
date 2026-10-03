export type Incident = {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  reportedBy?: string;
  resolvedAt?: string;
  archived?: boolean;
};

export type IncidentEvent = {
  id: string;
  type: string;
  actorId: string;
  detail: string;
  createdAt: string;
};

export type Stats = {
  open: number;
  resolved: number;
  myReports: number;
  avgResolutionMinutes: number | null;
};
