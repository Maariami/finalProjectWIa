import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { AccountComponent } from './auth/components/account/account.component';
import { AdminComponent } from './auth/components/admin/admin.component';
import { adminGuard, authGuard } from './auth/guards/auth.guard';
import { productsRoutes } from './products/products.routes';

export const routes: Routes = [
  ...authRoutes,
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin/components/dashboard/admin-dashboard.component').then(
            (component) => component.AdminDashboardComponent,
          ),
      },
    ],
  },
  ...productsRoutes,
];
