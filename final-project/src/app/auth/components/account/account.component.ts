import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {
  protected readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.authenticationService
      .getCurrentUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        error: () => {
          if (!this.authenticationService.currentUser()) {
            void this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/account' },
            });
            return;
          }
          this.errorMessage.set('Your account details could not be loaded. Please try again.');
        },
      });
  }
}
