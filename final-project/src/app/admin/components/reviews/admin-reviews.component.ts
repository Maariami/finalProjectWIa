import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Review, ReviewPagedResult } from '../../../products/models/review.model';
import { AdminReviewsService } from '../../services/admin-reviews.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-reviews',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-reviews.component.html',
  styleUrl: './admin-reviews.component.scss',
})
export class AdminReviewsComponent implements OnInit {
  private readonly reviewsService = inject(AdminReviewsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly result = signal<ReviewPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly pageSize = 20;
  private page = 1;
  private filters = { productId: '', userId: '', rating: null as number | null };

  protected readonly filterForm = this.formBuilder.group({
    productId: this.formBuilder.nonNullable.control(''),
    userId: this.formBuilder.nonNullable.control(''),
    rating: this.formBuilder.control<number | null>(null, [Validators.min(1), Validators.max(5)]),
  });

  ngOnInit(): void {
    this.loadReviews();
  }

  protected applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const values = this.filterForm.getRawValue();
    this.filters = {
      productId: values.productId.trim(),
      userId: values.userId.trim(),
      rating: values.rating,
    };
    this.page = 1;
    this.loadReviews();
  }

  protected clearFilters(): void {
    this.filterForm.reset({ productId: '', userId: '', rating: null });
    this.filters = { productId: '', userId: '', rating: null };
    this.page = 1;
    this.loadReviews();
  }

  protected changePage(page: number): void {
    this.page = page;
    this.loadReviews();
  }

  protected deleteReview(review: Review): void {
    if (!window.confirm(`Permanently delete this review by ${review.author.fullName}?`)) return;

    this.deletingId.set(review.id);
    this.errorMessage.set(null);
    this.reviewsService
      .deleteReview(review.id)
      .pipe(
        tap(() => this.loadReviews()),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not delete this review.'));
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadReviews(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.reviewsService
      .getReviews({
        page: this.page,
        pageSize: this.pageSize,
        productId: this.filters.productId || undefined,
        userId: this.filters.userId || undefined,
        rating: this.filters.rating ?? undefined,
      })
      .pipe(
        tap((result) => {
          this.result.set(result);
          this.loading.set(false);
          if (this.page > result.totalPages && result.totalPages > 0) {
            this.page = result.totalPages;
            this.loadReviews();
          }
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(
            error instanceof HttpErrorResponse
              ? readAdminApiError(error, 'Could not load reviews.')
              : 'An unexpected error occurred while loading reviews.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
