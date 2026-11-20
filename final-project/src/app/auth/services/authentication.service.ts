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
  private readonly sessionStorageKey = 'shopsphere.auth.session';
  readonly currentUser = signal<UserDto | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly accessTokenExpiresAt = signal<string | null>(null);
  readonly refreshToken = signal<string | null>(null);
  readonly refreshTokenExpiresAt = signal<string | null>(null);

  constructor() {
    this.restoreSession();
  }

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
    this.sessionStorage().setItem(
      this.sessionStorageKey,
      JSON.stringify({
        currentUser: response.user,
        accessToken: response.accessToken,
        accessTokenExpiresAt: response.accessTokenExpiresAt,
        refreshToken: response.refreshToken,
        refreshTokenExpiresAt: response.refreshTokenExpiresAt,
      }),
    );
    this.currentUser.set(response.user);
    this.accessToken.set(response.accessToken);
    this.accessTokenExpiresAt.set(response.accessTokenExpiresAt);
    this.refreshToken.set(response.refreshToken);
    this.refreshTokenExpiresAt.set(response.refreshTokenExpiresAt);
  }

  clearSession(): void {
    this.sessionStorage().removeItem(this.sessionStorageKey);
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

  private restoreSession(): void {
    const serializedSession = this.sessionStorage().getItem(this.sessionStorageKey);
    if (!serializedSession) return;

    let session: unknown;
    try {
      session = JSON.parse(serializedSession);
    } catch (error: unknown) {
      if (!(error instanceof SyntaxError)) throw error;
      this.clearSession();
      return;
    }

    if (!this.isStoredSession(session)) {
      this.clearSession();
      return;
    }

    if (!this.isTokenValid(session.refreshToken, session.refreshTokenExpiresAt)) {
      this.clearSession();
      return;
    }

    this.currentUser.set(session.currentUser);
    this.accessToken.set(session.accessToken);
    this.accessTokenExpiresAt.set(session.accessTokenExpiresAt);
    this.refreshToken.set(session.refreshToken);
    this.refreshTokenExpiresAt.set(session.refreshTokenExpiresAt);
  }

  private isStoredSession(
    value: unknown,
  ): value is {
    currentUser: UserDto;
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
  } {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    if (
      !('currentUser' in value) ||
      !('accessToken' in value) ||
      !('accessTokenExpiresAt' in value) ||
      !('refreshToken' in value) ||
      !('refreshTokenExpiresAt' in value)
    ) {
      return false;
    }

    const user = value.currentUser;
    return (
      typeof value.accessToken === 'string' &&
      typeof value.accessTokenExpiresAt === 'string' &&
      typeof value.refreshToken === 'string' &&
      typeof value.refreshTokenExpiresAt === 'string' &&
      typeof user === 'object' &&
      user !== null &&
      'id' in user &&
      typeof user.id === 'string' &&
      'email' in user &&
      typeof user.email === 'string' &&
      'firstName' in user &&
      typeof user.firstName === 'string' &&
      'lastName' in user &&
      typeof user.lastName === 'string' &&
      'fullName' in user &&
      typeof user.fullName === 'string' &&
      'phoneNumber' in user &&
      (typeof user.phoneNumber === 'string' || user.phoneNumber === null) &&
      'avatarUrl' in user &&
      (typeof user.avatarUrl === 'string' || user.avatarUrl === null) &&
      'role' in user &&
      (user.role === 'Customer' || user.role === 'Admin') &&
      'emailConfirmed' in user &&
      typeof user.emailConfirmed === 'boolean' &&
      'createdAt' in user &&
      typeof user.createdAt === 'string'
    );
  }

  private sessionStorage(): Storage {
    return window.sessionStorage;
  }
}
