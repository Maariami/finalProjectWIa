import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, tap } from 'rxjs';
import { AdminDashboard } from '../../models/admin.model';
import { AdminDashboardService } from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly dashboardService = inject(AdminDashboardService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly dashboard = signal<AdminDashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardService
      .getDashboard()
      .pipe(
        tap((dashboard) => {
          this.dashboard.set(dashboard);
          this.loading.set(false);
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(this.getErrorMessage(error));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
        return body.detail;
      }
      if (error.status === 401) return 'Your session has expired. Sign in again.';
      if (error.status === 403) return 'Administrator access is required.';
      return error.message;
    }

    return 'An unexpected error occurred while loading the dashboard.';
  }
}
