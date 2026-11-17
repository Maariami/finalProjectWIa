import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { strongPasswordPattern } from '../../forms/auth-validation';
import { MessageResponse } from '../../models/auth.model';
import { AuthenticationService } from '../../services/authentication.service';
import { readAuthApiError } from '../../utils/auth-api-error';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    token: ['', Validators.required],
    newPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(strongPasswordPattern)],
    ],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly validationMessages = signal<string[]>([]);
  protected readonly resetResult = signal<MessageResponse | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.form.patchValue({
        email: params.get('email') ?? '',
        token: params.get('token') ?? '',
      });
    });
  }

  protected submit(): void {
    this.form.patchValue({ email: this.form.controls.email.value.trim() });
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.errorMessage.set(null);
    this.validationMessages.set([]);
    this.resetResult.set(null);
    this.loading.set(true);

    this.authenticationService
      .resetPassword(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.resetResult.set(response);
          this.form.controls.token.reset('');
          this.form.controls.newPassword.reset('');
        },
        error: (error: unknown) => {
          const apiError = readAuthApiError(
            error,
            'The password could not be reset. Check the link and try again.',
          );
          this.errorMessage.set(apiError.message);
          this.validationMessages.set(apiError.validationMessages);
        },
      });
  }
}
