import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { ResetPasswordComponent } from './reset-password.component';

const authenticationService = {
  resetPassword: vi.fn<AuthenticationService['resetPassword']>(),
};

describe('ResetPasswordComponent', () => {
  beforeEach(() => {
    authenticationService.resetPassword.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'reset-password', component: ResetPasswordComponent }]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('submits the email and token from the reset link with the new password', async () => {
    authenticationService.resetPassword.mockReturnValue(
      of({ message: 'Your password has been reset.' }),
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/reset-password?email=person%40example.com&token=reset-token',
      ResetPasswordComponent,
    );
    const passwordInput = harness.routeNativeElement?.querySelector(
      'input[formControlName="newPassword"]',
    ) as HTMLInputElement | null;
    if (!passwordInput) throw new Error('Missing new password input');
    passwordInput.value = 'NewExamplePass1';
    passwordInput.dispatchEvent(new Event('input'));
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    harness.detectChanges();

    expect(authenticationService.resetPassword).toHaveBeenCalledWith({
      email: 'person@example.com',
      token: 'reset-token',
      newPassword: 'NewExamplePass1',
    });
    expect(harness.routeNativeElement?.textContent).toContain('Your password has been reset.');
    expect(harness.routeNativeElement?.textContent).not.toContain('reset-token');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/login');
  });

  it('rejects weak passwords and displays invalid reset token errors', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/reset-password?email=person%40example.com&token=expired-token',
      ResetPasswordComponent,
    );
    const passwordInput = harness.routeNativeElement?.querySelector(
      'input[formControlName="newPassword"]',
    ) as HTMLInputElement | null;
    if (!passwordInput) throw new Error('Missing new password input');
    passwordInput.value = 'weak';
    passwordInput.dispatchEvent(new Event('input'));
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    harness.detectChanges();
    expect(authenticationService.resetPassword).not.toHaveBeenCalled();

    passwordInput.value = 'NewExamplePass1';
    passwordInput.dispatchEvent(new Event('input'));
    authenticationService.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { code: 'invalid_token' },
          }),
      ),
    );
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain(
      'This link is invalid or has expired.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('Your password has been reset.');
  });
});
