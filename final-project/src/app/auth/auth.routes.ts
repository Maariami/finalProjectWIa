import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (component) => component.RegisterComponent,
      ),
  },
];
