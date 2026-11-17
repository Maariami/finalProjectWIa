import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthenticationService } from './auth/services/authentication.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly authenticationService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    const refreshToken = this.authenticationService.getValidRefreshToken();
    if (!refreshToken) {
      this.authenticationService.clearSession();
      return;
    }

    this.logoutError.set(null);
    this.loggingOut.set(true);
    this.authenticationService
      .logout({ refreshToken })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loggingOut.set(false)),
      )
      .subscribe({
        error: () => {
          this.logoutError.set(
            'You have been signed out, but the server could not end the session.',
          );
        },
      });
  }
}
