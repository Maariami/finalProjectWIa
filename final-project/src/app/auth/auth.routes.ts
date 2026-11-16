import { Routes } from '@angular/router';

export const authRoutes: Routes = [
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
];
