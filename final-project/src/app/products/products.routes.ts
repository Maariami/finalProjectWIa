import { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: 'products/:idOrSlug',
    loadComponent: () =>
      import('./components/product-details/product-details.component').then(
        (component) => component.ProductDetailsComponent,
      ),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/product-catalog/product-catalog.component').then(
        (component) => component.ProductCatalogComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products',
  },
];
