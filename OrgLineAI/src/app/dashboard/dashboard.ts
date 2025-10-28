import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { AttendanceService } from '../services/attendance.service';
import { PunchStatus } from '../models/attendance-entry';
import { LeaveService } from '../services/leave.service';
import { LeaveBalance } from '../models/leave';
import { AnnouncementsService } from '../services/announcements.service';
import { CommonModule } from '@angular/common';
import { CalendarMarkService } from '../services/calendar-mark.service';

type DayMark = 'P' | 'L' | 'H' | 'PH' | 'HD' | 'A' | 'WO';
type Cell = { date: Date; inMonth: boolean; mark: DayMark | null };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  userName = 'Jane Doe';
  month = '';
  marks: Record<number, DayMark> = {};

  // Attendance Signals
  private punchSignal = signal<PunchStatus | null>(null);
  inTime = computed(() => this.punchSignal()?.lastIn ?? '--:--');
  outTime = computed(() => this.punchSignal()?.lastOut ?? '--:--');
  totalHours = computed(() => {
    const mins = this.punchSignal()?.totalMinutesToday ?? 0;
    return (mins / 60).toFixed(2) + 'h';
  });
  punchButtonLabel = computed(() => {
    const status = this.punchSignal();
    if (!status) return 'Punch In';
    return status.isPunchedIn ? 'Punch Out' : 'Punch In';
  });

  // Leave Balance Signals
  private leaveBalanceSignal = signal<LeaveBalance | null>(null);
  totalLeaves = computed(() => this.leaveBalanceSignal()?.total ?? 0);
  usedLeaves = computed(() => this.leaveBalanceSignal()?.used ?? 0);
  availableLeaves = computed(() => this.leaveBalanceSignal()?.available ?? 0);

  // Announcements & Notices
  announcements = signal<any[]>([]);
  notices = signal<any[]>([]);

  // ---- Calendar ----
  private today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth0 = signal(this.today.getMonth()); // 0-based

  // month cells (6x7 view)
  cells = computed<Cell[]>(() => {
    const y = this.currentYear();
    const m0 = this.currentMonth0();

    const first = new Date(y, m0, 1);
    const startOffset = first.getDay(); // Sun-first
    const start = new Date(y, m0, 1 - startOffset);

    const statusMap = this.cm.getMonthStatusMap(y, m0);
    const arr: Cell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === m0;
      const ymd = this.toYmd(d);
      const mark = inMonth ? ((statusMap.get(ymd) as DayMark | undefined) ?? null) : null;
      arr.push({ date: d, inMonth, mark });
    }
    return arr;
  });

  // dynamic month stats (from visible cells)
  monthStats = computed(() => {
    const counts: Record<DayMark, number> = { P: 0, HD: 0, L: 0, PH: 0, WO: 0, A: 0, H: 0 };
    for (const c of this.cells()) {
      if (!c.inMonth || !c.mark) continue;
      counts[c.mark] = (counts[c.mark] ?? 0) + 1;
    }
    return counts;
  });

  // selection for day details
  selected = signal<Cell | null>(null);
  dayPunches = signal<{ in: string; out?: string }[]>([]);
  dayLeaves = signal<any[]>([]); // your Leave shape; we only display minimal fields

  private storageListener = (e: StorageEvent) => {
    if (!e.key) return;
    if (['attendance_entries', 'leaves', 'publicHolidays'].includes(e.key)) {
      this.refreshStatus();
      this.refreshLeaveBalance();
      this.refreshMonthMarks();
    }
  };

  constructor(
    private attendance: AttendanceService,
    private leaveService: LeaveService,
    private annService: AnnouncementsService,
    private cm: CalendarMarkService
  ) {}

  ngOnInit(): void {
    // 1) Read month from query params if present (?y=2025&m=10)
    const qp = this.route.snapshot.queryParamMap;
    const yParam = Number(qp.get('y'));
    const mParam = Number(qp.get('m')); // 1..12
    if (Number.isInteger(yParam) && Number.isInteger(mParam) && mParam >= 1 && mParam <= 12) {
      this.currentYear.set(yParam);
      this.currentMonth0.set(mParam - 1);
    }
    this.updateMonthLabel(this.currentYear(), this.currentMonth0());

    // 2) Data loads
    this.refreshStatus();
    this.refreshMonthMarks();
    this.refreshLeaveBalance();

    // 3) Announcements
    this.annService.seedIfEmpty();
    const all = this.annService.list();
    this.announcements.set(all.filter((a) => a.type === 'announcement'));
    this.notices.set(all.filter((a) => a.type === 'notice'));

    // 4) Auto-refresh when another tab updates localStorage
    window.addEventListener('storage', this.storageListener);

    // Debug signals
    effect(() => console.log('Punch status →', this.punchSignal()));
    effect(() => console.log('Leave balance →', this.leaveBalanceSignal()));
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  // ---- Punching ----
  onPunchClick(): void {
    const current = this.punchSignal();
    if (current?.isPunchedIn) {
      this.tryPunch(() => this.attendance.punchOut());
    } else {
      this.tryPunch(() => this.attendance.punchIn());
    }
    this.refreshMonthMarks();
    if (this.selected()) this.selectDay(this.selected()!); // live-update detail if today selected
  }
  private tryPunch(action: () => PunchStatus): void {
    try {
      const updated = action();
      this.punchSignal.set(updated);
    } catch (err: any) {
      alert(err.message || err);
    }
  }
  private refreshStatus(): void {
    const status = this.attendance.getPunchStatus();
    this.punchSignal.set(status);
  }

  // ---- Leaves ----
  private refreshLeaveBalance(): void {
    const balance = this.leaveService.getBalance();
    this.leaveBalanceSignal.set(balance);
  }

  // ---- Calendar actions ----
  prevMonth(): void {
    const y = this.currentYear();
    const m = this.currentMonth0();
    const [ny, nm0] = m === 0 ? [y - 1, 11] : [y, m - 1];
    this.currentYear.set(ny);
    this.currentMonth0.set(nm0);
    this.updateMonthLabel(ny, nm0);
    this.refreshMonthMarks();
    this.router.navigate([], { queryParams: { y: ny, m: nm0 + 1 }, queryParamsHandling: 'merge' });
  }
  nextMonth(): void {
    const y = this.currentYear();
    const m = this.currentMonth0();
    const [ny, nm0] = m === 11 ? [y + 1, 0] : [y, m + 1];
    this.currentYear.set(ny);
    this.currentMonth0.set(nm0);
    this.updateMonthLabel(ny, nm0);
    this.refreshMonthMarks();
    this.router.navigate([], { queryParams: { y: ny, m: nm0 + 1 }, queryParamsHandling: 'merge' });
  }
  isToday(d: Date): boolean {
    const t = this.today;
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  /** Tooltip for a cell dot */
  getTitle(c: { date: Date; mark: DayMark | null }): string {
    if (!c.mark) return '';
    const ymd = this.toYmd(c.date);
    switch (c.mark) {
      case 'PH': return this.holidayNameMap().get(ymd) || 'Public Holiday';
      case 'L':  return 'Leave';
      case 'HD': return 'Half Day';
      case 'P':  return 'Present';
      case 'WO': return 'Week Off';
      case 'A':  return 'Absent';
      case 'H':  return 'Holiday';
      default:   return String(c.mark);
    }
  }

  // Holiday names for tooltips
  holidayNameMap = computed(() =>
    this.cm.getHolidayNameMap(this.currentYear(), this.currentMonth0())
  );

  private refreshMonthMarks(): void {
    const y = this.currentYear();
    const m0 = this.currentMonth0();
    const statusMap = this.cm.getMonthStatusMap(y, m0);
    const lastDay = new Date(y, m0 + 1, 0).getDate();
    const out: Record<number, DayMark> = {};
    for (let day = 1; day <= lastDay; day++) {
      const ymd = this.toYmd(new Date(y, m0, day));
      const mark = statusMap.get(ymd) as DayMark | undefined;
      if (mark) out[day] = mark;
    }
    this.marks = out;
  }

  selectDay(c: Cell): void {
    if (!c.inMonth) return;
    this.selected.set(c);
    const ymd = this.toYmd(c.date);
    // punches
    const rec = this.readAttendanceByISO(ymd);
    this.dayPunches.set(rec?.punches ?? []);
    // leaves (read from localStorage directly to avoid changing your LeaveService)
    this.dayLeaves.set(this.readLeavesOn(ymd));
  }

  private updateMonthLabel(year: number, month0: number) {
    this.month = new Date(year, month0, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  private toYmd(d: Date) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ------- lightweight readers (keep services untouched) -------
  private readAttendanceByISO(iso: string): { punches: { in: string; out?: string }[] } | null {
    try {
      const raw = localStorage.getItem('attendance_entries') || '[]';
      const arr = JSON.parse(raw) as any[];
      return arr.find(r => r.dateISO === iso) ?? null;
    } catch { return null; }
  }
  private readLeavesOn(iso: string): any[] {
    try {
      const raw = localStorage.getItem('leaves') || '[]';
      const arr = JSON.parse(raw) as any[];
      const d = new Date(iso);
      return arr.filter(l => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        const okStatus = ['approved','pending'].includes((l.status || '').toLowerCase());
        return okStatus && d >= s && d <= e;
      });
    } catch { return []; }
  }
}
