import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import {
  AuthResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  UserDto,
} from '../models/auth.model';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpTestingController: HttpTestingController;
  const baseUrl = `${API_BASE_URL}/api/auth`;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthenticationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  it('sends registration details and returns registration response', () => {
    const requestBody: RegisterRequest = {
      email: 'person@example.com',
      password: 'ExamplePass1',
      firstName: 'First',
      lastName: 'Last',
    };
    const response: RegisterResponse = {
      userId: '4a77b32f-f9cc-44fb-bddc-0f86507967b1',
      email: requestBody.email,
      message: 'Confirmation required',
      mockEmail: {
        to: requestBody.email,
        subject: 'Confirm account',
        body: 'Follow the confirmation link.',
        link: '/confirm-email?email=person%40example.com&token=test-token',
        token: 'test-token',
      },
    };
    let result: RegisterResponse | undefined;

    service.register(requestBody).subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(response, { status: 201, statusText: 'Created' });
    expect(result).toEqual(response);
  });

  it('uses the documented endpoints and bodies for authentication actions', () => {
    const messageResponse: MessageResponse = { message: 'Request accepted' };
    const authResponse: AuthResponse = {
      accessToken: 'test-access-token',
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshToken: 'test-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: '4a77b32f-f9cc-44fb-bddc-0f86507967b1',
        email: 'person@example.com',
        firstName: 'First',
        lastName: 'Last',
        fullName: 'First Last',
        phoneNumber: null,
        avatarUrl: null,
        role: 'Customer',
        emailConfirmed: true,
        createdAt: '2026-11-16T20:00:00Z',
      },
    };
    const expectPost = <T extends object>(
      observable: Observable<T>,
      path: string,
      body: unknown,
      response: T,
    ): void => {
      observable.subscribe();
      const request = httpTestingController.expectOne(`${baseUrl}/${path}`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush(response);
    };

    expectPost(
      service.confirmEmail({ email: 'person@example.com', token: 'confirm-token' }),
      'confirm-email',
      { email: 'person@example.com', token: 'confirm-token' },
      messageResponse,
    );
    expectPost(
      service.resendConfirmation({ email: 'person@example.com' }),
      'resend-confirmation',
      { email: 'person@example.com' },
      messageResponse,
    );
    expectPost(
      service.login({ email: 'person@example.com', password: 'ExamplePass1' }),
      'login',
      { email: 'person@example.com', password: 'ExamplePass1' },
      authResponse,
    );
    expect(service.currentUser()).toEqual(authResponse.user);
    expect(service.accessToken()).toBe(authResponse.accessToken);
    expect(service.getValidAccessToken()).toBe(authResponse.accessToken);
    expect(service.getValidRefreshToken()).toBe(authResponse.refreshToken);
    expectPost(
      service.refresh({ refreshToken: 'test-refresh-token' }),
      'refresh',
      { refreshToken: 'test-refresh-token' },
      authResponse,
    );
    expectPost(
      service.forgotPassword({ email: 'person@example.com' }),
      'forgot-password',
      { email: 'person@example.com' },
      messageResponse,
    );
    expectPost(
      service.resetPassword({
        email: 'person@example.com',
        token: 'reset-token',
        newPassword: 'NewExamplePass1',
      }),
      'reset-password',
      {
        email: 'person@example.com',
        token: 'reset-token',
        newPassword: 'NewExamplePass1',
      },
      messageResponse,
    );
    service.clearSession();
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('does not return expired tokens as valid', () => {
    service.login({ email: 'person@example.com', password: 'ExamplePass1' }).subscribe();
    const request = httpTestingController.expectOne(`${baseUrl}/login`);
    request.flush({
      accessToken: 'expired-access-token',
      accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      refreshToken: 'test-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user-id',
        email: 'person@example.com',
        firstName: 'First',
        lastName: 'Last',
        fullName: 'First Last',
        phoneNumber: null,
        avatarUrl: null,
        role: 'Customer',
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
      },
    } satisfies AuthResponse);

    expect(service.getValidAccessToken()).toBeNull();
    expect(service.getValidRefreshToken()).toBe('test-refresh-token');
  });

  it('restores a valid session after the service is recreated', () => {
    service.login({ email: 'person@example.com', password: 'ExamplePass1' }).subscribe();
    httpTestingController.expectOne(`${baseUrl}/login`).flush({
      accessToken: 'persisted-access-token',
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshToken: 'persisted-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user-id',
        email: 'person@example.com',
        firstName: 'First',
        lastName: 'Last',
        fullName: 'First Last',
        phoneNumber: null,
        avatarUrl: null,
        role: 'Customer',
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
      },
    } satisfies AuthResponse);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const restoredService = TestBed.inject(AuthenticationService);

    expect(restoredService.currentUser()?.email).toBe('person@example.com');
    expect(restoredService.getValidAccessToken()).toBe('persisted-access-token');
    expect(restoredService.getValidRefreshToken()).toBe('persisted-refresh-token');

    restoredService.clearSession();
    expect(sessionStorage.getItem('shopsphere.auth.session')).toBeNull();
  });

  it('sends the refresh token for logout and accepts an empty success response', () => {
    service.logout({ refreshToken: 'test-refresh-token' }).subscribe();

    const request = httpTestingController.expectOne(`${baseUrl}/logout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refreshToken: 'test-refresh-token' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('retrieves the current user from the documented endpoint', () => {
    const user: UserDto = {
      id: '4a77b32f-f9cc-44fb-bddc-0f86507967b1',
      email: 'person@example.com',
      firstName: 'First',
      lastName: 'Last',
      fullName: 'First Last',
      phoneNumber: null,
      avatarUrl: null,
      role: 'Admin',
      emailConfirmed: true,
      createdAt: '2026-11-16T20:00:00Z',
    };
    let result: UserDto | undefined;

    service.getCurrentUser().subscribe((value) => {
      result = value;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/me`);
    expect(request.request.method).toBe('GET');
    request.flush(user);
    expect(result).toEqual(user);
    expect(service.currentUser()).toEqual(user);
  });

  it('clears local session state when the current-user endpoint rejects authentication', () => {
    service.login({ email: 'person@example.com', password: 'ExamplePass1' }).subscribe();
    httpTestingController.expectOne(`${baseUrl}/login`).flush({
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'user-id',
        email: 'person@example.com',
        firstName: 'First',
        lastName: 'Last',
        fullName: 'First Last',
        phoneNumber: null,
        avatarUrl: null,
        role: 'Customer',
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
      },
    } satisfies AuthResponse);
    service.getCurrentUser().subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${baseUrl}/me`)
      .flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.refreshToken()).toBeNull();
  });
});
