import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterResponse } from '../../models/auth.model';
import { AuthenticationService } from '../../services/authentication.service';
import { readAuthApiError } from '../../utils/auth-api-error';
import { strongPasswordPattern } from '../../forms/auth-validation';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(50), Validators.pattern(/\S/)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(50), Validators.pattern(/\S/)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(strongPasswordPattern)],
    ],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly validationMessages = signal<string[]>([]);
  protected readonly registration = signal<RegisterResponse | null>(null);

  protected submit(): void {
    this.form.patchValue({
      email: this.form.controls.email.value.trim(),
      firstName: this.form.controls.firstName.value.trim(),
      lastName: this.form.controls.lastName.value.trim(),
    });
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.errorMessage.set(null);
    this.validationMessages.set([]);
    this.registration.set(null);
    this.loading.set(true);

    this.authenticationService
      .register(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.registration.set(response);
          this.form.controls.password.reset('');
        },
        error: (error: unknown) => {
          const apiError = readAuthApiError(
            error,
            'Registration could not be completed. Please try again.',
          );
          this.errorMessage.set(apiError.message);
          this.validationMessages.set(apiError.validationMessages);
        },
      });
  }
}
