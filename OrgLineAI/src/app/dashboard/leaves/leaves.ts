import { Component, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { Leave } from '../../models/leave';

/** View model used only by template */
interface LeaveView extends Leave {
  title: string;
  dateRange: string;
  daysLabel: string;
  canCancel: boolean;
}

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    NgFor,
    NgClass,
    NgIf,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './leaves.html',
  styleUrls: ['./leaves.css'],
})
export class Leaves implements OnInit {
  userName = 'Jane Doe';

  // Reactive state
  private leavesSignal = signal<LeaveView[]>([]);
  private balanceSignal = signal({
    total: 0,
    used: 0,
    available: 0,
  });

  totals = computed(() => {
    const b = this.balanceSignal();
    const leaves = this.leavesSignal();
    return {
      total: b.total,
      used: b.used,
      available: b.available,
      pending: leaves.filter((l) => l.status === 'Pending').length,
    };
  });

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.refreshLeaves();
  }

  private refreshLeaves(): void {
    const list = this.leaveService.list();
    const mapped: LeaveView[] = list.map((l) => ({
      ...l,
      title: `${l.type} Leave`,
      dateRange: `${l.startISO} to ${l.endISO}`,
      daysLabel: l.days === 1 ? '1 day' : `${l.days} days`,
      canCancel: l.status === 'Pending',
    }));
    this.leavesSignal.set(mapped);
    this.balanceSignal.set(this.leaveService.getBalance());
  }

  get leaves(): LeaveView[] {
    return this.leavesSignal();
  }
  

  onCancel(item: LeaveView): void {
    try {
      this.leaveService.cancel(item.id);
      this.refreshLeaves();
      alert('Leave cancelled successfully.');
    } catch (err: any) {
      alert(err.message || err);
    }
  }
}
