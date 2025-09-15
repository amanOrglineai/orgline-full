import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

interface LeaveItem {
  title: string;
  dateRange: string;
  days: string;      // e.g. "3 days" or "0.5 day – First Half"
  status: LeaveStatus;
  canCancel?: boolean;
  icon?: 'pending' | 'approved' | 'rejected';
}
@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, NgFor, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './leaves.html',
  styleUrl: './leaves.css'
})
export class Leaves {
userName = 'Jane Doe';

  // Top metrics
  totals = {
    total: 20,
    used: 12,
    pending: 4,
    available: 8
  };

  // Mock list (matches screenshot)
  leaves: LeaveItem[] = [
    {
      title: 'Vacation',
      dateRange: '2025-09-01 to 2025-09-03',
      days: '3 days',
      status: 'Pending',
      icon: 'pending'
    },
    {
      title: 'Vacation',
      dateRange: '2025-08-10 to 2025-08-15',
      days: '5 days',
      status: 'Approved',
      canCancel: true,
      icon: 'approved'
    },
    {
      title: 'Personal Leave',
      dateRange: '2025-09-01 to 2025-09-09',
      days: '0.5 day – First Half',
      status: 'Pending',
      icon: 'pending'
    }
  ];

  // actions (wire later)
  onCancel(item: LeaveItem) {
    console.log('Cancel clicked', item);
  }
}
