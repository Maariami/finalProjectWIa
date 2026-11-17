import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { ForgotPasswordComponent } from './forgot-password.component';

const authenticationService = {
  forgotPassword: vi.fn<AuthenticationService['forgotPassword']>(),
};

describe('ForgotPasswordComponent', () => {
  beforeEach(() => {
    authenticationService.forgotPassword.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'forgot-password', component: ForgotPasswordComponent }]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('submits a trimmed email and displays the documented generic response', async () => {
    authenticationService.forgotPassword.mockReturnValue(
      of({
        message: 'If this account exists, a password reset email has been sent.',
        mockEmail: {
          to: 'person@example.com',
          subject: 'Reset your password',
          body: '',
          link: '/reset-password?email=person%40example.com&token=reset-token',
          token: 'reset-token',
        },
      }),
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/forgot-password', ForgotPasswordComponent);
    const emailInput = harness.routeNativeElement?.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;
    if (!emailInput) throw new Error('Missing email input');
    emailInput.value = ' person@example.com ';
    emailInput.dispatchEvent(new Event('input'));
    const submitButton = harness.routeNativeElement?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    harness.detectChanges();

    expect(authenticationService.forgotPassword).toHaveBeenCalledWith({
      email: 'person@example.com',
    });
    expect(harness.routeNativeElement?.textContent).toContain(
      'If this account exists, a password reset email has been sent.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('reset-token');
    expect(
      harness.routeNativeElement?.querySelector('.auth-mock-email a')?.getAttribute('href'),
    ).toBe('/reset-password?email=person%40example.com&token=reset-token');
  });

  it('prevents invalid emails from submitting and displays rate-limit errors', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/forgot-password', ForgotPasswordComponent);
    const emailInput = harness.routeNativeElement?.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;
    if (!emailInput) throw new Error('Missing email input');
    emailInput.value = 'invalid-email';
    emailInput.dispatchEvent(new Event('input'));
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    harness.detectChanges();

    expect(authenticationService.forgotPassword).not.toHaveBeenCalled();

    emailInput.value = 'person@example.com';
    emailInput.dispatchEvent(new Event('input'));
    authenticationService.forgotPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { code: 'too_many_requests' },
          }),
      ),
    );
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain(
      'Too many authentication requests. Please try again later.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain(
      'password reset email has been sent',
    );
  });
});
