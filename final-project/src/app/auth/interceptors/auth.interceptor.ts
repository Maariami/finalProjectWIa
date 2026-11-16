import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AuthenticationService } from '../services/authentication.service';

const apiOrigin = new URL(API_BASE_URL).origin;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const requestUrl = new URL(request.url, API_BASE_URL);
  if (requestUrl.origin !== apiOrigin) return next(request);

  const isCurrentUserRequest = requestUrl.pathname === '/api/auth/me';
  if (requestUrl.pathname.startsWith('/api/auth/') && !isCurrentUserRequest) {
    return next(request);
  }

  const accessToken = inject(AuthenticationService).getValidAccessToken();
  if (!accessToken) return next(request);

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    }),
  );
};
