import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AttendanceService } from '../services/attendance.service';
import { PunchStatus } from '../models/attendance-entry';
import { LeaveService } from '../services/leave.service';
import { LeaveBalance } from '../models/leave';
import { AnnouncementsService } from '../services/announcements.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatButtonModule,CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  userName = 'Jane Doe';
  month = '';
  marks: Record<number, 'P' | 'L' | 'H'> = {};

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

  // Announcements & Notices Signals
  announcements = signal<any[]>([]);
  notices = signal<any[]>([]);

  constructor(
    private attendance: AttendanceService,
    private leaveService: LeaveService,
    private annService: AnnouncementsService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.month = now.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    // Attendance
    this.refreshStatus();
    this.marks = this.attendance.getMonthSummary(
      now.getFullYear(),
      now.getMonth()
    );

    // Leave balance
    this.refreshLeaveBalance();

    // Announcements
    this.annService.seedIfEmpty();
    const all = this.annService.list();
    this.announcements.set(all.filter((a) => a.type === 'announcement'));
    this.notices.set(all.filter((a) => a.type === 'notice'));

    // Debug signals
    effect(() => console.log('Punch status changed →', this.punchSignal()));
    effect(() => console.log('Leave balance changed →', this.leaveBalanceSignal()));
  }

  // ---- Punching ----
  onPunchClick(): void {
    const current = this.punchSignal();
    if (current?.isPunchedIn) {
      this.tryPunch(() => this.attendance.punchOut());
    } else {
      this.tryPunch(() => this.attendance.punchIn());
    }
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
}
