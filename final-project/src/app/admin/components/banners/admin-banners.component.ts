import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { AdminBanner } from '../../models/admin.model';
import { AdminBannersService } from '../../services/admin-banners.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-banners',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-banners.component.html',
  styleUrl: './admin-banners.component.scss',
})
export class AdminBannersComponent implements OnInit {
  private readonly bannersService = inject(AdminBannersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly banners = signal<AdminBanner[]>([]);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly activeFilter = signal('');

  ngOnInit(): void {
    this.loadBanners();
  }

  protected filterBanners(value: string): void {
    this.activeFilter.set(value);
    this.loadBanners();
  }

  protected bannerStatus(banner: AdminBanner): string {
    if (!banner.isActive) return 'Inactive';
    const now = Date.now();
    if (banner.startsAt && Date.parse(banner.startsAt) > now) return 'Scheduled';
    if (banner.endsAt && Date.parse(banner.endsAt) <= now) return 'Expired';
    return banner.isCurrentlyVisible ? 'Visible' : 'Not currently visible';
  }

  protected deleteBanner(banner: AdminBanner): void {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;

    this.deletingId.set(banner.id);
    this.errorMessage.set(null);
    this.bannersService
      .deleteBanner(banner.id)
      .pipe(
        tap(() => this.loadBanners()),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not delete this banner.'));
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadBanners(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const isActive = this.activeFilter();
    this.bannersService
      .getBanners(isActive === '' ? undefined : isActive === 'true')
      .pipe(
        tap((banners) => {
          this.banners.set(banners);
          this.loading.set(false);
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(
            error instanceof HttpErrorResponse
              ? readAdminApiError(error, 'Could not load banners.')
              : 'An unexpected error occurred while loading banners.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
