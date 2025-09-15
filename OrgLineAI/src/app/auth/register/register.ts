import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormControl,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';

type RegForm = {
  fullName: FormControl<string>;
  email: FormControl<string>;
  mobileCountry: FormControl<string>;
  mobileNumber: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  terms: FormControl<boolean>;
};

function passwordComplexity(): ValidatorFn {
  const upper = /[A-Z]/, lower = /[a-z]/, digit = /\d/, special = /[^A-Za-z0-9]/;
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = (ctrl.value ?? '') as string;
    if (!v) return null;
    const ok = v.length >= 8 && upper.test(v) && lower.test(v) && digit.test(v) && special.test(v);
    return ok ? null : { complexity: true };
  };
}

function matchFields(a: string, b: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const A = group.get(a)?.value;
    const B = group.get(b)?.value;
    return A === B ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,

    // Material
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    // Inline SVGs (Google / Microsoft)
    const googleSvg = this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C34.1 31.7 29.5 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.1-5.1C33.3 6.2 28.9 4.5 24 4.5 16 4.5 9 9.2 6.3 14.7z"/>
        <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.9 15.1 18.5 12 24 12c3 0 5.7 1.1 7.8 3l5.1-5.1C33.3 6.2 28.9 4.5 24 4.5 16 4.5 9 9.2 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 45.5c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.2C29.5 35 26.9 36 24 36c-5.5 0-10.1-3.3-11.9-8l-5.8 4.5C9 40.8 16 45.5 24 45.5z"/>
        <path fill="#1976D2" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1 3-3.4 5.5-6.4 6.5l6.4 5.2c3.7-3.4 6.2-8.4 6.2-14.3 0-1.6-.2-3.1-.6-4.5z"/>
      </svg>
    `);
    this.iconRegistry.addSvgIconLiteral('auth-google', googleSvg);

    const msSvg = this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 23 23" aria-hidden="true">
        <rect width="10" height="10" x="1" y="1" fill="#F25022"/>
        <rect width="10" height="10" x="12" y="1" fill="#7FBA00"/>
        <rect width="10" height="10" x="1" y="12" fill="#00A4EF"/>
        <rect width="10" height="10" x="12" y="12" fill="#FFB900"/>
      </svg>
    `);
    this.iconRegistry.addSvgIconLiteral('auth-microsoft', msSvg);
  }

  // ----- UI state (signals)
  submitting = signal(false);
  serverError = signal<string | null>(null);

  // Show/hide password fields
  showPass = signal(false);
  showConfirm = signal(false);

  // ----- Form (no referral, no OTP)
  form = this.fb.group<RegForm>(
    {
      fullName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      mobileCountry: this.fb.nonNullable.control('+91', [Validators.required]),
      mobileNumber: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^\d{7,15}$/),
      ]),
      password: this.fb.nonNullable.control('', [Validators.required, passwordComplexity()]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
      terms: this.fb.nonNullable.control(false, [Validators.requiredTrue]),
    },
    { validators: [matchFields('password', 'confirmPassword')] }
  );

  // Convenience getters (no function calls in template)
  fullName = this.form.controls.fullName;
  email = this.form.controls.email;
  mobileCountry = this.form.controls.mobileCountry;
  mobileNumber = this.form.controls.mobileNumber;
  password = this.form.controls.password;
  confirmPassword = this.form.controls.confirmPassword;
  terms = this.form.controls.terms;

  // Password strength meter
  strength = computed(() => {
    const v = this.password.value ?? '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const pct = Math.min(100, (score / 5) * 100);
    const label = score <= 2 ? 'Weak' : score === 3 || score === 4 ? 'Medium' : 'Strong';
    return { pct, label, score };
  });

  submit() {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.snack.open('Account created! Redirecting…', 'OK', { duration: 2200 });
      // TODO: navigate after success
    }, 1100);
  }

  social(provider: 'google' | 'microsoft') {
    this.snack.open(`Continue with ${provider === 'google' ? 'Google' : 'Microsoft'}`, 'OK', {
      duration: 1500,
    });
  }
}
