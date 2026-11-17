import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import {
  AuthResponse,
  ConfirmEmailRequest,
  EmailRequest,
  LoginRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UserDto,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/auth`;
  readonly currentUser = signal<UserDto | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly accessTokenExpiresAt = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);
  readonly refreshTokenExpiresAt = signal<string | null>(null);

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, request);
  }

  confirmEmail(request: ConfirmEmailRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/confirm-email`, request);
  }

  resendConfirmation(request: EmailRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/resend-confirmation`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  refresh(request: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh`, request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(request: RefreshTokenRequest): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, request)
      .pipe(finalize(() => this.clearSession()));
  }

  forgotPassword(request: EmailRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/reset-password`, request);
  }

  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/me`).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.clearSession();
        }
        return throwError(() => error);
      }),
    );
  }

  private storeSession(response: AuthResponse): void {
    this.currentUser.set(response.user);
    this.accessToken.set(response.accessToken);
    this.accessTokenExpiresAt.set(response.accessTokenExpiresAt);
    this.refreshToken.set(response.refreshToken);
    this.refreshTokenExpiresAt.set(response.refreshTokenExpiresAt);
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.accessTokenExpiresAt.set(null);
    this.refreshToken.set(null);
    this.refreshTokenExpiresAt.set(null);
  }

  getValidAccessToken(): string | null {
    return this.isTokenValid(this.accessToken(), this.accessTokenExpiresAt())
      ? this.accessToken()
      : null;
  }

  getValidRefreshToken(): string | null {
    return this.isTokenValid(this.refreshToken(), this.refreshTokenExpiresAt())
      ? this.refreshToken()
      : null;
  }

  private isTokenValid(token: string | null, expiresAt: string | null): boolean {
    if (!token || !expiresAt) return false;
    const expirationTime = Date.parse(expiresAt);
    return Number.isFinite(expirationTime) && expirationTime > Date.now();
  }
}
