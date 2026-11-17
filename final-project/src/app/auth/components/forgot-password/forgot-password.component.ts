import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageResponse } from '../../models/auth.model';
import { AuthenticationService } from '../../services/authentication.service';
import { readAuthApiError } from '../../utils/auth-api-error';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly validationMessages = signal<string[]>([]);
  protected readonly requestResult = signal<MessageResponse | null>(null);

  protected submit(): void {
    this.form.patchValue({ email: this.form.controls.email.value.trim() });
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.errorMessage.set(null);
    this.validationMessages.set([]);
    this.requestResult.set(null);
    this.loading.set(true);

    this.authenticationService
      .forgotPassword(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => this.requestResult.set(response),
        error: (error: unknown) => {
          const apiError = readAuthApiError(
            error,
            'The password reset request could not be completed. Please try again.',
          );
          this.errorMessage.set(apiError.message);
          this.validationMessages.set(apiError.validationMessages);
        },
      });
  }
}
