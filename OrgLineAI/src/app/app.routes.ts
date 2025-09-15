import { Routes } from '@angular/router';
import { Register } from './auth/register/register';
import { Login } from './auth/login/login';
import { Dashboard } from './dashboard/dashboard';
import { Leaves } from './dashboard/leaves/leaves';
import { ApplyLeave } from './dashboard/apply-leave/apply-leave';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },
  { path: 'leaves', component: Leaves },
  { path: 'apply', component: ApplyLeave },
];
