import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-register',
  imports: [
    RouterModule,
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  hidePassword: boolean = true;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      console.log('Registering user:', formData);
      // TODO: Call backend API to register user
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
