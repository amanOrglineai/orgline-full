export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveType = 'Casual' | 'Sick' | 'Earned';

export interface Leave {
  id: string;
  type: LeaveType;
  startISO: string;
  endISO: string;
  days: number;
  status: LeaveStatus;
  reason?: string;
}

export interface LeaveBalance {
  total: number;
  used: number;
  available: number;
}
