import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
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

  const signIn = (accessTokenExpiresAt: string): void => {
    const response: AuthResponse = {
      accessToken: 'test-access-token',
      accessTokenExpiresAt,
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
    };
    authenticationService.login({ email: 'person@example.com', password: 'password' }).subscribe();
    const loginRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/login`);
    loginRequest.flush(response);
  };

  it('adds a valid Bearer token only to requests on the ShopSphere API', () => {
    signIn(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    http.get(`${API_BASE_URL}/api/products`).subscribe();
    http.get(`${API_BASE_URL}/api/auth/me`).subscribe();
    http.post(`${API_BASE_URL}/api/auth/login`, {}).subscribe();
    http.get('https://other.example/api/products').subscribe();

    const productRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/products`);
    const currentUserRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/me`);
    const loginRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/login`);
    const externalRequest = httpTestingController.expectOne('https://other.example/api/products');

    expect(productRequest.request.headers.get('Authorization')).toBe(
      'Bearer test-access-token',
    );
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
    signIn(new Date(Date.now() - 1000).toISOString());
    http.get(`${API_BASE_URL}/api/products`).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/api/products`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
