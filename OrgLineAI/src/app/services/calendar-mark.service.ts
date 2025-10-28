import { Injectable } from '@angular/core';

type Status = 'PH' | 'L' | 'HD' | 'P' | 'WO' | 'A';

interface AttendanceEntry {
  dateISO: string; // 'YYYY-MM-DD'
  punches: { in: string; out?: string }[];
  totalMinutes: number; // computed
}

interface LeaveRec {
  id?: string;
  type?: string;           // e.g., 'Sick', 'Casual', 'Half Day'
  startDate: string;       // 'YYYY-MM-DD'
  endDate: string;         // 'YYYY-MM-DD'
  status?: string;         // 'approved' | 'pending' | 'rejected' | ...
  halfDay?: boolean | 'AM' | 'PM';
}

interface HolidayRec {
  date: string; // 'YYYY-MM-DD'
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarMarkService {
  /** CONFIG: weekends off (0=Sun ... 6=Sat). */
  private WEEKLY_OFF = new Set<number>([0, 6]);

  /** Half-day threshold from attendance (in minutes). Adjust if your org differs. */
  private HALF_DAY_THRESHOLD = 240; // 4h

  /** Which leave statuses should count on the calendar */
  private LEAVE_STATUSES = new Set(['approved', 'pending']);

  /** MAIN: Status map for all days in the given month. */
  getMonthStatusMap(year: number, month0: number): Map<string, Status> {
    const map = new Map<string, Status>();

    const present = this.getPresentSet(year, month0);
    const halfDayAttendance = this.getAttendanceHalfDays(year, month0);
    const { full: leaveFull, half: leaveHalf } = this.getLeaveSets(year, month0);
    const holidays = this.getHolidaySet(year, month0);

    const lastDay = new Date(year, month0 + 1, 0).getDate();
    const todayYMD = this.toYmd(new Date());

    for (let day = 1; day <= lastDay; day++) {
      const d = new Date(year, month0, day);
      const ymd = this.toYmd(d);
      const dow = d.getDay(); // 0=Sun ... 6=Sat
      const isWeeklyOff = this.WEEKLY_OFF.has(dow);
      const isPast = ymd < todayYMD;

      // Precedence: PH > L > HD > P > WO > A
      if (holidays.has(ymd)) {
        map.set(ymd, 'PH');
        continue;
      }
      if (leaveFull.has(ymd)) {
        map.set(ymd, 'L');
        continue;
      }
      if (leaveHalf.has(ymd) || halfDayAttendance.has(ymd)) {
        map.set(ymd, 'HD');
        continue;
      }
      if (present.has(ymd)) {
        map.set(ymd, 'P'); // if worked on weekend, mark P
        continue;
      }
      if (isWeeklyOff) {
        map.set(ymd, 'WO');
        continue;
      }
      if (isPast) {
        map.set(ymd, 'A');
      }
    }

    return map;
  }

  // ---------- Attendance ----------

  private readAttendance(): AttendanceEntry[] {
    try {
      const raw = localStorage.getItem('attendance_entries') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as AttendanceEntry[]) : [];
    } catch {
      return [];
    }
  }

  /** Present if any minutes > 0 or any punch exists. */
  private getPresentSet(year: number, month0: number): Set<string> {
    const set = new Set<string>();
    for (const rec of this.readAttendance()) {
      const d = new Date(rec.dateISO);
      if (isNaN(+d)) continue;
      if (d.getFullYear() === year && d.getMonth() === month0) {
        if ((rec.totalMinutes ?? 0) > 0 || (rec.punches?.length ?? 0) > 0) {
          set.add(this.toYmd(d));
        }
      }
    }
    return set;
  }

  /** Half Day if minutes are between 1 and threshold-1. */
  private getAttendanceHalfDays(year: number, month0: number): Set<string> {
    const set = new Set<string>();
    for (const rec of this.readAttendance()) {
      const d = new Date(rec.dateISO);
      if (isNaN(+d)) continue;
      if (d.getFullYear() === year && d.getMonth() === month0) {
        const mins = rec.totalMinutes ?? 0;
        if (mins > 0 && mins < this.HALF_DAY_THRESHOLD) {
          set.add(this.toYmd(d));
        }
      }
    }
    return set;
  }

  // ---------- Leaves ----------

  private readLeaves(): LeaveRec[] {
    try {
      const raw = localStorage.getItem('leaves') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as LeaveRec[]) : [];
    } catch {
      return [];
    }
  }

  private getLeaveSets(year: number, month0: number): { full: Set<string>; half: Set<string> } {
    const full = new Set<string>();
    const half = new Set<string>();
    for (const l of this.readLeaves()) {
      const status = (l.status || '').toLowerCase();
      if (!this.LEAVE_STATUSES.has(status)) continue;

      const start = this.safeYmd(l.startDate);
      const end = this.safeYmd(l.endDate);
      if (!start || !end) continue;

      const isHalf =
        l.halfDay === true ||
        l.halfDay === 'AM' ||
        l.halfDay === 'PM' ||
        l.type?.toLowerCase?.() === 'half day';

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() !== year || d.getMonth() !== month0) continue;
        const ymd = this.toYmd(d);
        if (isHalf && this.sameDate(d, start)) half.add(ymd);
        else full.add(ymd);
      }
    }
    return { full, half };
  }

  // ---------- Public Holidays ----------

  private readHolidays(): HolidayRec[] {
    try {
      const raw = localStorage.getItem('publicHolidays') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as HolidayRec[]) : [];
    } catch {
      return [];
    }
  }

  private getHolidaySet(year: number, month0: number): Set<string> {
    const set = new Set<string>();
    for (const h of this.readHolidays()) {
      const d = this.safeYmd(h.date);
      if (!d) continue;
      if (d.getFullYear() === year && d.getMonth() === month0) set.add(this.toYmd(d));
    }
    return set;
  }

  /** 'YYYY-MM-DD' -> holiday name (for tooltips) */
  getHolidayNameMap(year: number, month0: number): Map<string, string> {
    const map = new Map<string, string>();
    try {
      const raw = localStorage.getItem('publicHolidays') || '[]';
      const arr = JSON.parse(raw) as { date: string; name: string }[];
      for (const h of Array.isArray(arr) ? arr : []) {
        const d = this.safeYmd(h.date);
        if (!d) continue;
        if (d.getFullYear() === year && d.getMonth() === month0) {
          map.set(this.toYmd(d), h.name || 'Public Holiday');
        }
      }
    } catch {}
    return map;
  }

  // ---------- utils ----------

  private toYmd(d: Date) {
    const y = d.getFullYear(),
      m = `${d.getMonth() + 1}`.padStart(2, '0'),
      day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private safeYmd(s: string | undefined) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(+d) ? null : d;
  }

  private sameDate(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
