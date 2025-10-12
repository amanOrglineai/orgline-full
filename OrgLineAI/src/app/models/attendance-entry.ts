export interface AttendanceEntry {
  dateISO: string;
  punches: { in?: string; out?: string }[];
  totalMinutes: number;
}

export interface PunchStatus {
  today: Date;
  lastIn?: string;
  lastOut?: string;
  isPunchedIn: boolean;
  totalMinutesToday: number;
}
