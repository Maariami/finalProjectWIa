import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

const isAuthenticated = (authenticationService: AuthenticationService): boolean => {
  if (
    authenticationService.currentUser() &&
    (authenticationService.getValidAccessToken() || authenticationService.getValidRefreshToken())
  ) {
    return true;
  }

  authenticationService.clearSession();
  return false;
};

const loginRedirect = (router: Router, returnUrl: string) =>
  router.createUrlTree(['/login'], { queryParams: { returnUrl } });

export const authGuard: CanActivateFn = (_route, state) => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);

  return isAuthenticated(authenticationService) ? true : loginRedirect(router, state.url);
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const user = authenticationService.currentUser();

  if (!isAuthenticated(authenticationService)) {
    return loginRedirect(router, state.url);
  }

  return user?.role === 'Admin' ? true : router.createUrlTree(['/products']);
};
