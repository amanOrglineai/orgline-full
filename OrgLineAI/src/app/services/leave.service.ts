import { Injectable } from '@angular/core';
import { Leave, LeaveBalance } from '../models/leave';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly LEAVES_KEY = 'leaves';
  private readonly BALANCE_KEY = 'leave_balance';

  constructor(private storage: StorageService) {
    this.seedIfEmpty();
  }

  /** Seed demo leaves and initial balance */
  seedIfEmpty(): void {
    const existing = this.storage.get<Leave[]>(this.LEAVES_KEY);
    if (!existing || existing.length === 0) {
      const seeded: Leave[] = [
        {
          id: crypto.randomUUID(),
          type: 'Casual',
          startISO: '2025-08-10',
          endISO: '2025-08-15',
          days: 5,
          status: 'Approved',
          reason: 'Family trip',
        },
        {
          id: crypto.randomUUID(),
          type: 'Sick',
          startISO: '2025-09-01',
          endISO: '2025-09-03',
          days: 3,
          status: 'Pending',
          reason: 'Fever',
        },
      ];
      this.storage.set(this.LEAVES_KEY, seeded);
    }

    const balance = this.storage.get<LeaveBalance>(this.BALANCE_KEY);
    if (!balance) {
      this.storage.set(this.BALANCE_KEY, {
        total: 20,
        used: 8,
        available: 12,
      });
    }
  }

  /** Get all leaves */
  list(): Leave[] {
    return this.storage.get<Leave[]>(this.LEAVES_KEY) || [];
  }

  /** Get current balance */
  getBalance(): LeaveBalance {
    return (
      this.storage.get<LeaveBalance>(this.BALANCE_KEY) || {
        total: 20,
        used: 0,
        available: 20,
      }
    );
  }

  /** Apply a new leave (adds to list + updates balance) */
  apply(leave: Leave): void {
    const leaves = this.list();
    const balance = this.getBalance();

    // simple overlap check
    const overlap = leaves.some(
      (l) =>
        l.status !== 'Rejected' &&
        !(new Date(leave.endISO) < new Date(l.startISO) ||
          new Date(leave.startISO) > new Date(l.endISO))
    );
    if (overlap) throw new Error('Leave overlaps existing leave.');

    if (balance.available < leave.days)
      throw new Error('Insufficient leave balance.');

    leave.id = crypto.randomUUID();
    leave.status = 'Pending';
    leaves.push(leave);

    balance.used += leave.days;
    balance.available = balance.total - balance.used;

    this.storage.set(this.LEAVES_KEY, leaves);
    this.storage.set(this.BALANCE_KEY, balance);
  }

  /** Cancel a pending leave */
  cancel(id: string): void {
    const leaves = this.list();
    const balance = this.getBalance();

    const leave = leaves.find((l) => l.id === id);
    if (!leave) return;

    if (leave.status !== 'Pending') {
      throw new Error('Only pending leaves can be cancelled.');
    }

    leave.status = 'Cancelled';
    balance.used -= leave.days;
    balance.available = balance.total - balance.used;

    this.storage.set(this.LEAVES_KEY, leaves);
    this.storage.set(this.BALANCE_KEY, balance);
  }
}
