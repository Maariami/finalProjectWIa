import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AuthResponse } from '../models/auth.model';
import { AuthenticationService } from '../services/authentication.service';

const apiOrigin = new URL(API_BASE_URL).origin;
let refreshRequest: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const requestUrl = new URL(request.url, API_BASE_URL);
  if (requestUrl.origin !== apiOrigin) return next(request);

  const isCurrentUserRequest = requestUrl.pathname === '/api/auth/me';
  if (requestUrl.pathname.startsWith('/api/auth/') && !isCurrentUserRequest) {
    return next(request);
  }

  const authenticationService = inject(AuthenticationService);
  const accessToken = authenticationService.getValidAccessToken();
  const authenticatedRequest = accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;
  const retryWithToken = (token: string) =>
    next(
      request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    ).pipe(
      catchError((retryError: unknown) => {
        if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
          authenticationService.clearSession();
        }
        return throwError(() => retryError);
      }),
    );

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const currentAccessToken = authenticationService.getValidAccessToken();
      if (currentAccessToken && currentAccessToken !== accessToken) {
        return retryWithToken(currentAccessToken);
      }

      const refreshToken = authenticationService.getValidRefreshToken();
      if (!refreshToken) {
        authenticationService.clearSession();
        return throwError(() => error);
      }

      if (!refreshRequest) {
        refreshRequest = authenticationService.refresh({ refreshToken }).pipe(
          finalize(() => {
            refreshRequest = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refreshRequest.pipe(
        catchError((refreshError: unknown) => {
          authenticationService.clearSession();
          return throwError(() => refreshError);
        }),
        switchMap((response) => retryWithToken(response.accessToken)),
      );
    }),
  );
};
