import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
// NOTE: Only import NgIf/NgForOf if your template actually uses them
// import { NgIf, NgForOf } from '@angular/common';

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
    // NgIf, NgForOf, // <-- only if used in apply-leave.html
  ],
  templateUrl: './apply-leave.html',
  styleUrl: './apply-leave.css'
})
export class ApplyLeave {
  userName = 'Jane Doe';
  fileName = 'No file chosen';

  // declare, don't initialize yet (fb not ready)
  form!: LeaveForm;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      leaveType: this.fb.control<string | null>('Vacation', { validators: Validators.required }),
      duration: this.fb.control<'full' | 'half' | null>('full', { validators: Validators.required }),
      startDate: this.fb.control<Date | null>(new Date(), { validators: Validators.required }),
      endDate: this.fb.control<Date | null>(new Date(), { validators: Validators.required }),
      reason: this.fb.control<string | null>(''),
      file: this.fb.control<File | null>(null), // <-- File | null fixes TS2322
    });
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileName = file ? file.name : 'No file chosen';
    this.form.patchValue({ file }); // matches control type
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('Submit Request', this.form.value);
    // TODO: call API
  }

  cancel() {
    this.form.reset({
      leaveType: 'Vacation',
      duration: 'full',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
      file: null
    });
    this.fileName = 'No file chosen';
  }
}
