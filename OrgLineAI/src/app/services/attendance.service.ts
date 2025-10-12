import { Injectable } from '@angular/core';
import { PunchStatus, AttendanceEntry } from '../models/attendance-entry';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private STORAGE_KEY = 'attendance_entries';

  /** Load all attendance records */
  private load(): AttendanceEntry[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  /** Save all attendance records */
  private save(all: AttendanceEntry[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  /** Get today’s record */
  private getTodayRecord(): AttendanceEntry {
    const todayISO = new Date().toISOString().split('T')[0];
    const all = this.load();
    let rec = all.find(a => a.dateISO === todayISO);
    if (!rec) {
      rec = { dateISO: todayISO, punches: [], totalMinutes: 0 };
      all.push(rec);
      this.save(all);
    }
    return rec;
  }

  /** Punch In */
  punchIn(): PunchStatus {
    const rec = this.getTodayRecord();

    // prevent double punch-in
    const last = rec.punches[rec.punches.length - 1];
    if (last && !last.out) {
      throw new Error('Already punched in.');
    }

    rec.punches.push({ in: new Date().toISOString() });
    this.saveUpdated(rec);

    return this.getPunchStatus();
  }

  /** Punch Out */
  punchOut(): PunchStatus {
    const rec = this.getTodayRecord();
    const last = rec.punches[rec.punches.length - 1];
    if (!last || last.out) {
      throw new Error('Cannot punch out before punching in.');
    }

    last.out = new Date().toISOString();
    rec.totalMinutes = this.computeTotalMinutes(rec);
    this.saveUpdated(rec);

    return this.getPunchStatus();
  }

  /** Compute total worked minutes */
  private computeTotalMinutes(rec: AttendanceEntry): number {
    let total = 0;
    for (const p of rec.punches) {
      if (p.in && p.out) {
        const diff = (new Date(p.out).getTime() - new Date(p.in).getTime()) / 60000;
        total += diff;
      }
    }
    return Math.round(total);
  }

  /** Persist one record into list */
  private saveUpdated(rec: AttendanceEntry) {
    const all = this.load();
    const idx = all.findIndex(a => a.dateISO === rec.dateISO);
    if (idx !== -1) all[idx] = rec;
    else all.push(rec);
    this.save(all);
  }

  /** Returns current punch status */
  getPunchStatus(): PunchStatus {
    const rec = this.getTodayRecord();
    const last = rec.punches[rec.punches.length - 1];
    return {
      today: new Date(),
      lastIn: last?.in ? this.formatTime(last.in) : undefined,
      lastOut: last?.out ? this.formatTime(last.out) : undefined,
      isPunchedIn: !!(last && !last.out),
      totalMinutesToday: rec.totalMinutes
    };
  }

  /** Calendar summary mock */
  getMonthSummary(year: number, month: number): Record<number, 'P' | 'L' | 'H'> {
    const marks: Record<number, 'P' | 'L' | 'H'> = {};
    const all = this.load();
    all.forEach(rec => {
      const d = new Date(rec.dateISO);
      if (d.getFullYear() === year && d.getMonth() === month) {
        marks[d.getDate()] = rec.totalMinutes > 0 ? 'P' : 'L';
      }
    });
    return marks;
  }

  private formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
