import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserDto } from '../models/auth.model';
import { AuthenticationService } from '../services/authentication.service';
import { adminGuard, authGuard } from './auth.guard';

@Component({ template: 'Login page' })
class LoginPageComponent {}

@Component({ template: 'Account page' })
class AccountPageComponent {}

@Component({ template: 'Admin page' })
class AdminPageComponent {}

@Component({ template: 'Catalog page' })
class CatalogPageComponent {}

describe('auth guards', () => {
  const currentUser = signal<UserDto | null>(null);
  let validAccessToken: string | null;
  let validRefreshToken: string | null;

  beforeEach(() => {
    currentUser.set(null);
    validAccessToken = null;
    validRefreshToken = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginPageComponent },
          {
            path: 'account',
            component: AccountPageComponent,
            canActivate: [authGuard],
          },
          {
            path: 'admin',
            component: AdminPageComponent,
            canActivate: [adminGuard],
          },
          { path: 'products', component: CatalogPageComponent },
        ]),
        {
          provide: AuthenticationService,
          useValue: {
            currentUser,
            getValidAccessToken: () => validAccessToken,
            getValidRefreshToken: () => validRefreshToken,
            clearSession: () => {
              currentUser.set(null);
              validAccessToken = null;
              validRefreshToken = null;
            },
          },
        },
      ],
    });
  });

  it('redirects unauthenticated direct navigation to login with its return URL', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/account');

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Faccount');
    expect(harness.routeNativeElement?.textContent).toContain('Login page');
  });

  it('allows admins and redirects customers away from the admin page', async () => {
    currentUser.set({
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
    });
    validAccessToken = 'access-token';
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/products');
    expect(harness.routeNativeElement?.textContent).toContain('Catalog page');

    currentUser.set({ ...currentUser()!, role: 'Admin' });
    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Admin page');
  });

  it('clears an authenticated user whose token session has expired', async () => {
    currentUser.set({
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
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/account');

    expect(currentUser()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Faccount');
  });
});
