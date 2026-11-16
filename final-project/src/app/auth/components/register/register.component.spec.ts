import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../services/authentication.service';
import { RegisterComponent } from './register.component';

const authenticationService = {
  register: vi.fn<AuthenticationService['register']>(),
};

const setInput = (
  fixture: ComponentFixture<RegisterComponent>,
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

describe('RegisterComponent', () => {
  beforeEach(() => {
    authenticationService.register.mockReset();
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('prevents invalid names and passwords from being submitted', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    setInput(fixture, 'email', 'person@example.com');
    setInput(fixture, 'firstName', 'A'.repeat(51));
    setInput(fixture, 'lastName', 'Last');
    setInput(fixture, 'password', 'weak');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(authenticationService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Choose a password that meets the requirements above.',
    );
  });

  it('submits the documented payload and displays the registration result', () => {
    authenticationService.register.mockReturnValue(
      of({
        userId: '4a77b32f-f9cc-44fb-bddc-0f86507967b1',
        email: 'person@example.com',
        message: 'Please confirm your email.',
        mockEmail: {
          to: 'person@example.com',
          subject: 'Confirm account',
          body: 'Follow the link.',
          link: '/confirm-email?email=person%40example.com&token=test-token',
          token: 'test-token',
        },
      }),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    setInput(fixture, 'email', ' person@example.com ');
    setInput(fixture, 'firstName', ' First ');
    setInput(fixture, 'lastName', ' Last ');
    setInput(fixture, 'password', 'ExamplePass1');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(authenticationService.register).toHaveBeenCalledWith({
      email: 'person@example.com',
      firstName: 'First',
      lastName: 'Last',
      password: 'ExamplePass1',
    });
    expect(fixture.nativeElement.textContent).toContain('Please confirm your email.');
    expect(
      fixture.nativeElement.querySelector('.auth-mock-email a')?.getAttribute('href'),
    ).toBe('/confirm-email?email=person%40example.com&token=test-token');
    expect(
      fixture.nativeElement.querySelector('[formControlName="password"]'),
    ).toBeNull();
  });

  it('displays API validation errors without reporting success', () => {
    authenticationService.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              detail: 'Registration failed.',
              errors: { password: ['Password must contain a number.'] },
            },
          }),
      ),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    setInput(fixture, 'email', 'person@example.com');
    setInput(fixture, 'firstName', 'First');
    setInput(fixture, 'lastName', 'Last');
    setInput(fixture, 'password', 'ExamplePass1');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Registration failed.');
    expect(fixture.nativeElement.textContent).toContain('Password must contain a number.');
    expect(fixture.nativeElement.textContent).not.toContain('Registration received');
  });

  it('displays duplicate-email errors without reporting success', () => {
    authenticationService.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'email_taken' },
          }),
      ),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    setInput(fixture, 'email', 'person@example.com');
    setInput(fixture, 'firstName', 'First');
    setInput(fixture, 'lastName', 'Last');
    setInput(fixture, 'password', 'ExamplePass1');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'An account with this email already exists.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Registration received');
  });
});
