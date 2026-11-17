import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from './core/api/api-base-url';
import { App } from './app';
import { AuthenticationService } from './auth/services/authentication.service';

describe('App', () => {
  let httpTestingController: HttpTestingController;
  let authenticationService: AuthenticationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    authenticationService = TestBed.inject(AuthenticationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const signIn = (): void => {
    authenticationService
      .login({ email: 'person@example.com', password: 'ExamplePass1' })
      .subscribe();
    httpTestingController.expectOne(`${API_BASE_URL}/api/auth/login`).flush({
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshToken: 'refresh-token',
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
    });
  };

  it('clears the visible authenticated state after logout', () => {
    signIn();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('First Last');
    fixture.nativeElement.querySelector('button').click();
    const logoutRequest = httpTestingController.expectOne(`${API_BASE_URL}/api/auth/logout`);
    expect(logoutRequest.request.body).toEqual({ refreshToken: 'refresh-token' });
    logoutRequest.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(authenticationService.currentUser()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('First Last');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[routerLink="/login"]')).not.toBeNull();
  });

  it('clears the visible session and reports a server logout failure', () => {
    signIn();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    httpTestingController
      .expectOne(`${API_BASE_URL}/api/auth/logout`)
      .flush({ detail: 'Logout unavailable' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(authenticationService.currentUser()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('First Last');
    expect(fixture.nativeElement.textContent).toContain(
      'You have been signed out, but the server could not end the session.',
    );
  });
});
