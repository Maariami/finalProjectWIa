import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageResponse } from '../../models/auth.model';
import { AuthenticationService } from '../../services/authentication.service';
import { readAuthApiError } from '../../utils/auth-api-error';

@Component({
  selector: 'app-confirm-email',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-email.component.html',
})
export class ConfirmEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    token: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly validationMessages = signal<string[]>([]);
  protected readonly confirmation = signal<MessageResponse | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
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
    this.confirmation.set(null);
    this.loading.set(true);

    this.authenticationService
      .confirmEmail(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.confirmation.set(response);
          this.form.controls.token.reset('');
        },
        error: (error: unknown) => {
          const apiError = readAuthApiError(
            error,
            'Email confirmation could not be completed. Request a new link and try again.',
          );
          this.errorMessage.set(apiError.message);
          this.validationMessages.set(apiError.validationMessages);
        },
      });
  }
}
