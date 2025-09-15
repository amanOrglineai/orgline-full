import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, MatButtonModule, RouterLink, RouterLinkActive],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  userName = 'Jane Doe';
  month = 'August 2025';

  // Just to show colored dots on the calendar
  // key: day number, value: 'P' | 'L' | 'H'
  marks: Record<number, 'P' | 'L' | 'H'> = {
    1: 'P', 5: 'P', 6: 'P', 8: 'P', 12: 'L', 13: 'L', 15: 'L',
    18: 'H', 21: 'L', 23: 'H'
  };
}
