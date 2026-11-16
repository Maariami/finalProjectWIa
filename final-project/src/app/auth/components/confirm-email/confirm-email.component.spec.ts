import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { ConfirmEmailComponent } from './confirm-email.component';

const authenticationService = {
  confirmEmail: vi.fn<AuthenticationService['confirmEmail']>(),
};

describe('ConfirmEmailComponent', () => {
  beforeEach(() => {
    authenticationService.confirmEmail.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'confirm-email', component: ConfirmEmailComponent }]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('submits the email and token from the confirmation link', async () => {
    authenticationService.confirmEmail.mockReturnValue(
      of({ message: 'Email confirmed.' }),
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/confirm-email?email=person%40example.com&token=confirmation-token',
      ConfirmEmailComponent,
    );
    const submitButton = harness.routeNativeElement?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    harness.detectChanges();

    expect(authenticationService.confirmEmail).toHaveBeenCalledWith({
      email: 'person@example.com',
      token: 'confirmation-token',
    });
    expect(harness.routeNativeElement?.textContent).toContain('Email confirmed.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/login');
  });

  it('shows invalid or expired token errors without showing success', async () => {
    authenticationService.confirmEmail.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { code: 'invalid_token' },
          }),
      ),
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/confirm-email?email=person%40example.com&token=expired-token',
      ConfirmEmailComponent,
    );
    const submitButton = harness.routeNativeElement?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    submitButton?.click();
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain(
      'This link is invalid or has expired.',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('Email confirmed.');
  });
});
