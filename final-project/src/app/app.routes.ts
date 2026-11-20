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
      {
        path: 'categories',
        loadComponent: () =>
          import('./admin/components/categories/admin-categories.component').then(
            (component) => component.AdminCategoriesComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./admin/components/products/admin-product-form.component').then(
            (component) => component.AdminProductFormComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./admin/components/products/admin-product-form.component').then(
            (component) => component.AdminProductFormComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./admin/components/products/admin-products.component').then(
            (component) => component.AdminProductsComponent,
          ),
      },
      {
        path: 'banners/new',
        loadComponent: () =>
          import('./admin/components/banners/admin-banner-form.component').then(
            (component) => component.AdminBannerFormComponent,
          ),
      },
      {
        path: 'banners/:id',
        loadComponent: () =>
          import('./admin/components/banners/admin-banner-form.component').then(
            (component) => component.AdminBannerFormComponent,
          ),
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('./admin/components/banners/admin-banners.component').then(
            (component) => component.AdminBannersComponent,
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./admin/components/reviews/admin-reviews.component').then(
            (component) => component.AdminReviewsComponent,
          ),
      },
    ],
  },
  ...productsRoutes,
];
