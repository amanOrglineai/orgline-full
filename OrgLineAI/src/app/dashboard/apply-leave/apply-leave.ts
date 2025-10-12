import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { AttendanceService } from '../../services/attendance.service';

type LeaveForm = FormGroup<{
  leaveType: FormControl<string | null>;
  duration: FormControl<'full' | 'half' | null>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
  reason: FormControl<string | null>;
  file: FormControl<File | null>;
}>;

@Component({
  selector: 'app-apply-leave',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './apply-leave.html',
  styleUrls: ['./apply-leave.css'],
})
export class ApplyLeave {
  userName = 'Jane Doe';
  fileName = 'No file chosen';
  form!: LeaveForm;

  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private attendance: AttendanceService,
    private router: Router
  ) {
    this.form = this.fb.group({
      leaveType: this.fb.control<string | null>('Vacation', {
        validators: Validators.required,
      }),
      duration: this.fb.control<'full' | 'half' | null>('full', {
        validators: Validators.required,
      }),
      startDate: this.fb.control<Date | null>(new Date(), {
        validators: Validators.required,
      }),
      endDate: this.fb.control<Date | null>(new Date(), {
        validators: Validators.required,
      }),
      reason: this.fb.control<string | null>('', {
        validators: Validators.required,
      }),
      file: this.fb.control<File | null>(null),
    });
  }

  /** File picker */
  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileName = file ? file.name : 'No file chosen';
    this.form.patchValue({ file });
  }

  /** Cancel resets to defaults */
  cancel() {
    this.form.reset({
      leaveType: 'Vacation',
      duration: 'full',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
      file: null,
    });
    this.fileName = 'No file chosen';
  }

  /** Submit form → validate, apply, redirect */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please fill all required fields correctly.');
      return;
    }

    const value = this.form.value;
    const start = value.startDate!;
    const end = value.endDate!;

    // --- 1️⃣ Validate date range ---
    if (end < start) {
      alert('End date cannot be before start date.');
      return;
    }

    // --- 2️⃣ Prevent applying leave for today if punched in ---
    const today = new Date().toISOString().split('T')[0];
    const status = this.attendance.getPunchStatus();
    const isTodayOnLeave =
      start.toISOString().split('T')[0] === today && status.isPunchedIn;
    if (isTodayOnLeave) {
      alert('You cannot apply leave for today after punching in.');
      return;
    }

    // --- 3️⃣ Prepare leave object ---
    const days =
      value.duration === 'half'
        ? 0.5
        : Math.floor(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

    try {
      this.leaveService.apply({
        id: crypto.randomUUID(),
        type: value.leaveType as any,
        startISO: start.toISOString().split('T')[0],
        endISO: end.toISOString().split('T')[0],
        days,
        status: 'Pending',
        reason: value.reason || '',
      });

      alert('Leave applied successfully.');
      this.router.navigate(['/leaves']);
    } catch (err: any) {
      alert(err.message || err);
    }
  }
}
