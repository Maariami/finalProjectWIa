import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { ResendConfirmationComponent } from './resend-confirmation.component';

const authenticationService = {
  resendConfirmation: vi.fn<AuthenticationService['resendConfirmation']>(),
};

describe('ResendConfirmationComponent', () => {
  beforeEach(() => {
    authenticationService.resendConfirmation.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'resend-confirmation', component: ResendConfirmationComponent }]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('resends confirmation using the email from the URL and shows the response', async () => {
    authenticationService.resendConfirmation.mockReturnValue(
      of({
        message: 'If this account exists, a confirmation email has been sent.',
        mockEmail: {
          to: 'person@example.com',
          subject: 'Confirm your email',
          body: '',
          link: 'https://example.com/confirm-email',
          token: 'private-token',
        },
      }),
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/resend-confirmation?email=person%40example.com',
      ResendConfirmationComponent,
    );

    const submitButton = harness.routeNativeElement?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    harness.detectChanges();

    expect(authenticationService.resendConfirmation).toHaveBeenCalledWith({
      email: 'person@example.com',
    });
    expect(harness.routeNativeElement?.textContent).toContain(
      'If this account exists, a confirmation email has been sent.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('private-token');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/confirm-email',
    );
  });

  it('does not send an invalid email and displays rate-limit errors', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/resend-confirmation', ResendConfirmationComponent);
    const emailInput = harness.routeNativeElement?.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement | null;
    if (emailInput) {
      emailInput.value = 'not-an-email';
      emailInput.dispatchEvent(new Event('input'));
    }
    const submitButton = harness.routeNativeElement?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    harness.detectChanges();

    expect(authenticationService.resendConfirmation).not.toHaveBeenCalled();

    emailInput!.value = 'person@example.com';
    emailInput!.dispatchEvent(new Event('input'));
    authenticationService.resendConfirmation.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { code: 'too_many_requests' },
          }),
      ),
    );
    submitButton?.click();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain(
      'Too many authentication requests. Please try again later.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain(
      'If this account exists',
    );
  });
});
