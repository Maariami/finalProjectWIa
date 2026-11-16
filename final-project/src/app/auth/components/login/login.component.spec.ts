import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { throwError, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { LoginComponent } from './login.component';

const authenticationService = {
  login: vi.fn<AuthenticationService['login']>(),
};

const setInput = (
  fixture: ComponentFixture<LoginComponent>,
  name: string,
  value: string,
): void => {
  const input = fixture.nativeElement.querySelector(
    `[formControlName="${name}"]`,
  ) as HTMLInputElement | null;
  if (!input) throw new Error(`Missing input: ${name}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
};

describe('LoginComponent', () => {
  beforeEach(() => {
    authenticationService.login.mockReset();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('submits the credentials and navigates to the catalog on success', () => {
    authenticationService.login.mockReturnValue(
      of({
        accessToken: 'access-token',
        accessTokenExpiresAt: '2026-11-16T22:00:00Z',
        refreshToken: 'refresh-token',
        refreshTokenExpiresAt: '2026-11-23T21:00:00Z',
        user: {
          id: 'user-id',
          email: 'person@example.com',
          firstName: 'First',
          lastName: 'Last',
          fullName: 'First Last',
          phoneNumber: null,
          avatarUrl: null,
          role: 'Admin',
          emailConfirmed: true,
          createdAt: '2026-11-16T20:00:00Z',
        },
      }),
    );
    const fixture = TestBed.createComponent(LoginComponent);
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    setInput(fixture, 'email', ' person@example.com ');
    setInput(fixture, 'password', 'ExamplePass1');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(authenticationService.login).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'ExamplePass1',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/products');
    expect(
      (fixture.nativeElement.querySelector(
        '[formControlName="password"]',
      ) as HTMLInputElement | null)?.value,
    ).toBe('');
  });

  it('displays invalid credential errors without navigating', () => {
    authenticationService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { code: 'invalid_credentials' },
          }),
      ),
    );
    const fixture = TestBed.createComponent(LoginComponent);
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.detectChanges();
    setInput(fixture, 'email', 'person@example.com');
    setInput(fixture, 'password', 'wrong-password');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The email or password is incorrect.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
