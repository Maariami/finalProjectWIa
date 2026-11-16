import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { productsRoutes } from './products/products.routes';

export const routes: Routes = [...authRoutes, ...productsRoutes];
