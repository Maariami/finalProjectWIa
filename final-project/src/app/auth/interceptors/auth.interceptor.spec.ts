import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AuthResponse } from '../models/auth.model';
import { AuthenticationService } from '../services/authentication.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let authenticationService: AuthenticationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authenticationService = TestBed.inject(AuthenticationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const createAuthResponse = (
    accessToken = 'test-access-token',
    refreshToken = 'test-refresh-token',
    accessTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  ): AuthResponse => ({
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
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
  });

  const signIn = (response: AuthResponse = createAuthResponse()): void => {
    authenticationService.login({ email: 'person@example.com', password: 'password' }).subscribe();
    const loginRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/login`);
    loginRequest.flush(response);
  };

  it('adds a valid Bearer token only to requests on the ShopSphere API', () => {
    signIn();
    http.get(`${API_BASE_URL}/api/products`).subscribe();
    http.get(`${API_BASE_URL}/api/auth/me`).subscribe();
    http.post(`${API_BASE_URL}/api/auth/login`, {}).subscribe();
    http.get('https://other.example/api/products').subscribe();

    const productRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/products`);
    const currentUserRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/me`);
    const loginRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/login`);
    const externalRequest = httpTestingController.expectOne('https://other.example/api/products');

    expect(productRequest.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    expect(currentUserRequest.request.headers.get('Authorization')).toBe(
      'Bearer test-access-token',
    );
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    expect(externalRequest.request.headers.has('Authorization')).toBe(false);

    productRequest.flush({});
    currentUserRequest.flush({});
    loginRequest.flush({});
    externalRequest.flush({});
  });

  it('does not attach an expired access token', () => {
    signIn(
      createAuthResponse(
        'expired-access-token',
        'test-refresh-token',
        new Date(Date.now() - 1000).toISOString(),
      ),
    );
    http.get(`${API_BASE_URL}/api/products`).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/api/products`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('refreshes once for concurrent unauthorized requests and retries both with rotated tokens', () => {
    signIn();
    http.get(`${API_BASE_URL}/api/products/first`).subscribe();
    http.get(`${API_BASE_URL}/api/products/second`).subscribe();
    const firstRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/products/first`);
    const secondRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/products/second`);

    firstRequest.flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });
    secondRequest.flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/refresh`);
    expect(refreshRequest.request.body).toEqual({ refreshToken: 'test-refresh-token' });
    refreshRequest.flush(createAuthResponse('rotated-access-token', 'rotated-refresh-token'));

    const firstRetry = httpTestingController.expectOne(`${API_BASE_URL}/api/products/first`);
    const secondRetry = httpTestingController.expectOne(`${API_BASE_URL}/api/products/second`);
    expect(firstRetry.request.headers.get('Authorization')).toBe('Bearer rotated-access-token');
    expect(secondRetry.request.headers.get('Authorization')).toBe('Bearer rotated-access-token');
    expect(authenticationService.refreshToken()).toBe('rotated-refresh-token');
    firstRetry.flush({});
    secondRetry.flush({});
  });

  it('reuses a newly rotated token for a late unauthorized response', () => {
    signIn();
    http.get(`${API_BASE_URL}/api/products/first`).subscribe();
    http.get(`${API_BASE_URL}/api/products/second`).subscribe();
    httpTestingController
      .expectOne(`${API_BASE_URL}/api/products/first`)
      .flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });

    httpTestingController
      .expectOne(`${API_BASE_URL}/api/auth/refresh`)
      .flush(createAuthResponse('rotated-access-token', 'rotated-refresh-token'));
    httpTestingController.expectOne(`${API_BASE_URL}/api/products/first`).flush({});

    httpTestingController
      .expectOne(`${API_BASE_URL}/api/products/second`)
      .flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });
    const secondRetry = httpTestingController.expectOne(`${API_BASE_URL}/api/products/second`);
    expect(secondRetry.request.headers.get('Authorization')).toBe('Bearer rotated-access-token');
    secondRetry.flush({});
  });

  it('clears the session when the refresh token is rejected', () => {
    signIn();
    http.get(`${API_BASE_URL}/api/products`).subscribe({ error: () => undefined });
    httpTestingController
      .expectOne(`${API_BASE_URL}/api/products`)
      .flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });

    httpTestingController
      .expectOne(`${API_BASE_URL}/api/auth/refresh`)
      .flush({ code: 'invalid_token' }, { status: 401, statusText: 'Unauthorized' });

    expect(authenticationService.currentUser()).toBeNull();
    expect(authenticationService.accessToken()).toBeNull();
    expect(authenticationService.refreshToken()).toBeNull();
  });
});
