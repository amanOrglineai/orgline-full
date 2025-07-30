import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule, // ✅ Required for [formGroup]
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'] 
})
export class Login {
     loginForm: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      console.log('Logging in with:', formData);
      // TODO: Send credentials to your backend API
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
