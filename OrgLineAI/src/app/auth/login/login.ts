import { Component, ElementRef, QueryList, ViewChildren, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    const googleSvg = this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C34.1 31.7 29.5 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.1-5.1C33.3 6.2 28.9 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.6-.2-3.1-.6-4.5z"/>
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

  // Tabs (number signal – no binding to a function)
  selectedTab = signal(0);
  onTabChange(index: number) {
    this.selectedTab.set(index);
    if (index === 1) {
      this.otpSent.set(false);
      this.sendingOtp.set(false);
      this.otpDigits.forEach(c => c.setValue(''));
      setTimeout(() => this.otpBoxes?.first?.nativeElement?.focus(), 0);
    }
  }

  // Email/password form
  passwordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  // OTP login
  phoneCtrl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  otpDigits: FormControl<string>[] = Array.from({ length: 6 }).map(
    () => new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[0-9]$/)] })
  );

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;
  trackByIndex = (i: number) => i;

  onOtpInput(idx: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const digit = (input.value || '').replace(/\D/g, '').slice(-1);
    input.value = digit;
    this.otpDigits[idx].setValue(digit);
    if (digit && idx < this.otpDigits.length - 1) {
      const next = this.otpBoxes.get(idx + 1)?.nativeElement;
      next?.focus();
      next?.select();
    }
  }

  onOtpPaste(idx: number, ev: ClipboardEvent) {
    const data = ev.clipboardData?.getData('text') ?? '';
    const digits = data.replace(/\D/g, '').slice(0, 6 - idx).split('');
    if (!digits.length) return;
    ev.preventDefault();
    for (let i = 0; i < digits.length; i++) {
      const at = idx + i;
      if (at >= this.otpDigits.length) break;
      this.otpDigits[at].setValue(digits[i]);
    }
    const focusIdx = Math.min(idx + digits.length, this.otpDigits.length - 1);
    const el = this.otpBoxes.get(focusIdx)?.nativeElement;
    el?.focus();
    el?.select();
  }

  onOtpKeydown(idx: number, ev: KeyboardEvent) {
    const input = ev.target as HTMLInputElement;
    if (ev.key === 'Backspace' && !input.value && idx > 0) {
      const prev = this.otpBoxes.get(idx - 1)?.nativeElement;
      prev?.focus();
      prev?.select();
    }
    if (ev.key === 'ArrowLeft' && idx > 0) this.otpBoxes.get(idx - 1)?.nativeElement.focus();
    if (ev.key === 'ArrowRight' && idx < this.otpDigits.length - 1) this.otpBoxes.get(idx + 1)?.nativeElement.focus();
  }

  submitting = signal(false);
  sendingOtp = signal(false);
  otpSent = signal(false);

  submitPassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.snack.open('Login successful! Redirecting to dashboard…', 'OK', { duration: 2500 });
    }, 900);
  }

  sendOtp() {
    if (!this.phoneCtrl.value.trim()) {
      this.snack.open('Please enter your phone number', 'OK', { duration: 2200 });
      return;
    }
    this.sendingOtp.set(true);
    setTimeout(() => {
      this.sendingOtp.set(false);
      this.otpSent.set(true);
      setTimeout(() => this.otpBoxes.first?.nativeElement.focus(), 0);
    }, 1100);
  }

  submitOtp() {
    if (!this.otpSent()) {
      this.snack.open('Please request an OTP first', 'OK', { duration: 2000 });
      return;
    }
    if (this.otpDigits.some(c => c.invalid)) {
      this.snack.open('Please enter the 6-digit OTP', 'OK', { duration: 2000 });
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.snack.open('OTP verified! Redirecting to dashboard…', 'OK', { duration: 2500 });
    }, 900);
  }

  socialAuth(provider: 'google' | 'microsoft') {
    this.snack.open(`Continue with ${provider === 'google' ? 'Google' : 'Microsoft'}`, 'OK', { duration: 1600 });
  }
}
