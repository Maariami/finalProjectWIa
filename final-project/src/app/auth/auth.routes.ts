import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (component) => component.LoginComponent,
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./components/confirm-email/confirm-email.component').then(
        (component) => component.ConfirmEmailComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (component) => component.RegisterComponent,
      ),
  },
  {
    path: 'resend-confirmation',
    loadComponent: () =>
      import('./components/resend-confirmation/resend-confirmation.component').then(
        (component) => component.ResendConfirmationComponent,
      ),
  },
];
