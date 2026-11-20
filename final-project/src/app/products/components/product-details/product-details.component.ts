import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';
import { ProductsService } from '../../services/products.service';
import { ReviewsService } from '../../services/reviews.service';
import { ProductDetails } from '../../models/product.model';
import { ProductReviews, Review } from '../../models/review.model';
import { AuthenticationService } from '../../../auth/services/authentication.service';

@Component({
  selector: 'app-product-details',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly product = signal<ProductDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly productReviews = signal<ProductReviews | null>(null);
  protected readonly reviewsLoading = signal(false);
  protected readonly reviewsError = signal<string | null>(null);
  protected readonly reviewSubmitting = signal(false);
  protected readonly reviewSubmitError = signal<string | null>(null);
  protected readonly reviewSubmitSuccess = signal(false);
  protected readonly ownReview = signal<Review | null>(null);
  protected readonly ownReviewLoading = signal(false);
  protected readonly ownReviewError = signal<string | null>(null);
  protected readonly editingOwnReview = signal(false);
  protected readonly editSubmitting = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly editSuccess = signal(false);
  protected readonly deleteSubmitting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteSuccess = signal(false);

  protected readonly editReviewForm = this.formBuilder.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  private readonly authStateEffect = effect(() => {
    this.authenticationService.currentUser();
    this.authenticationService.accessToken();
    const product = this.product();

    if (!this.isAuthenticated()) {
      this.ownReview.set(null);
      this.ownReviewLoading.set(false);
      this.ownReviewError.set(null);
      this.editingOwnReview.set(false);
      this.editSubmitting.set(false);
      this.editError.set(null);
      this.editSuccess.set(false);
      this.deleteSubmitting.set(false);
      this.deleteError.set(null);
      this.deleteSuccess.set(false);
      return;
    }

    if (product) {
      this.loadOwnReview(product.id);
    }
  });

  protected readonly reviewForm = this.formBuilder.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('idOrSlug') ?? ''),
        distinctUntilChanged(),
        tap(() => {
          this.product.set(null);
          this.loading.set(true);
          this.notFound.set(false);
          this.errorMessage.set(null);
          this.productReviews.set(null);
          this.reviewsLoading.set(false);
          this.reviewsError.set(null);
          this.reviewSubmitError.set(null);
          this.reviewSubmitSuccess.set(false);
          this.reviewForm.reset({ rating: 0, comment: '' });
          this.ownReview.set(null);
          this.ownReviewLoading.set(false);
          this.ownReviewError.set(null);
        }),
        switchMap((idOrSlug) => {
          if (!idOrSlug) {
            this.notFound.set(true);
            this.loading.set(false);
            return EMPTY;
          }

          return this.productsService.getProductByIdOrSlug(idOrSlug).pipe(
            tap((product) => {
              this.product.set(product);
              this.loading.set(false);
              this.loadReviews(product);
              this.loadOwnReview(product.id);
            }),
            catchError((error: unknown) => {
              this.loading.set(false);
              if (error instanceof HttpErrorResponse && error.status === 404) {
                this.notFound.set(true);
              } else {
                this.errorMessage.set(this.getErrorMessage(error));
              }
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadReviews(product: ProductDetails): void {
    this.productReviews.set(null);
    this.reviewsLoading.set(true);
    this.reviewsError.set(null);

    this.reviewsService
      .getProductReviews(product.id, { page: 1, pageSize: 100 })
      .pipe(
        tap((reviews) => {
          if (this.product()?.id === product.id) {
            this.productReviews.set(reviews);
            this.reviewsLoading.set(false);
          }
        }),
        catchError((error: unknown) => {
          if (this.product()?.id === product.id) {
            this.reviewsLoading.set(false);
            this.reviewsError.set(this.getErrorMessage(error, 'reviews'));
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadOwnReview(productId: string): void {
    if (!this.isAuthenticated()) {
      this.ownReview.set(null);
      this.ownReviewLoading.set(false);
      this.ownReviewError.set(null);
      return;
    }

    this.ownReview.set(null);
    this.ownReviewLoading.set(true);
    this.ownReviewError.set(null);

    this.reviewsService
      .getMyReview(productId)
      .pipe(
        tap((review) => {
          if (this.product()?.id === productId && this.isAuthenticated()) {
            this.ownReview.set(review.productId === productId ? review : null);
            this.ownReviewLoading.set(false);
          }
        }),
        catchError((error: unknown) => {
          if (this.product()?.id !== productId) {
            return EMPTY;
          }

          this.ownReviewLoading.set(false);
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.ownReview.set(null);
            this.ownReviewError.set(null);
          } else if (error instanceof HttpErrorResponse && error.status === 401) {
            this.ownReview.set(null);
            this.ownReviewError.set('Sign in again to view your review.');
          } else {
            this.ownReview.set(null);
            this.ownReviewError.set(this.getReviewApiError(error));
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected distributionCount(star: number): number {
    const distribution = this.productReviews()?.distribution;
    if (!distribution) return 0;
    return distribution[String(star) as '1' | '2' | '3' | '4' | '5'];
  }

  protected isAuthenticated(): boolean {
    return this.authenticationService.getValidAccessToken() !== null;
  }

  protected submitReview(): void {
    const product = this.product();
    if (!product || !this.isAuthenticated()) {
      this.reviewSubmitError.set('Sign in to write a review.');
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      this.reviewSubmitError.set('Choose a rating from 1 to 5 and keep the comment within 1000 characters.');
      return;
    }

    const value = this.reviewForm.getRawValue();
    const comment = value.comment.trim();
    this.reviewSubmitting.set(true);
    this.reviewSubmitError.set(null);
    this.reviewSubmitSuccess.set(false);

    this.reviewsService
      .createReview(product.id, {
        rating: value.rating,
        comment: comment.length > 0 ? comment : null,
      })
      .pipe(
        tap(() => {
          if (this.product()?.id === product.id) {
            this.reviewSubmitSuccess.set(true);
            this.reviewForm.reset({ rating: 0, comment: '' });
            this.loadReviews(product);
            this.loadOwnReview(product.id);
          }
        }),
        catchError((error: unknown) => {
          if (this.product()?.id === product.id) {
            this.reviewSubmitError.set(this.getReviewApiError(error));
          }
          return EMPTY;
        }),
        finalize(() => {
          if (this.product()?.id === product.id) {
            this.reviewSubmitting.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected startEditingOwnReview(): void {
    const review = this.ownReview();
    if (!review) return;

    this.editReviewForm.reset({
      rating: review.rating,
      comment: review.comment ?? '',
    });
    this.editError.set(null);
    this.editSuccess.set(false);
    this.editingOwnReview.set(true);
  }

  protected cancelEditingOwnReview(): void {
    this.editingOwnReview.set(false);
    this.editError.set(null);
  }

  protected submitOwnReviewEdit(): void {
    const product = this.product();
    const review = this.ownReview();
    if (!product || !review) return;

    if (this.editReviewForm.invalid) {
      this.editReviewForm.markAllAsTouched();
      this.editError.set('Choose a rating from 1 to 5 and keep the comment within 1000 characters.');
      return;
    }

    const value = this.editReviewForm.getRawValue();
    const comment = value.comment.trim();
    this.editSubmitting.set(true);
    this.editError.set(null);
    this.editSuccess.set(false);

    this.reviewsService
      .updateReview(product.id, review.id, {
        rating: value.rating,
        comment: comment.length > 0 ? comment : null,
      })
      .pipe(
        tap(() => {
          if (this.product()?.id === product.id) {
            this.editSuccess.set(true);
            this.editingOwnReview.set(false);
            this.loadReviews(product);
            this.loadOwnReview(product.id);
          }
        }),
        catchError((error: unknown) => {
          if (this.product()?.id === product.id) {
            this.editError.set(this.getReviewApiError(error));
          }
          return EMPTY;
        }),
        finalize(() => {
          if (this.product()?.id === product.id) {
            this.editSubmitting.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected deleteOwnReview(): void {
    const product = this.product();
    const review = this.ownReview();
    if (!product || !review) return;

    this.deleteSubmitting.set(true);
    this.deleteError.set(null);
    this.deleteSuccess.set(false);

    this.reviewsService
      .deleteReview(product.id, review.id)
      .pipe(
        tap(() => {
          if (this.product()?.id === product.id) {
            this.ownReview.set(null);
            this.deleteSuccess.set(true);
            this.editingOwnReview.set(false);
            this.loadReviews(product);
            this.loadOwnReview(product.id);
          }
        }),
        catchError((error: unknown) => {
          if (this.product()?.id === product.id) {
            this.deleteError.set(this.getReviewApiError(error));
          }
          return EMPTY;
        }),
        finalize(() => {
          if (this.product()?.id === product.id) {
            this.deleteSubmitting.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private getReviewApiError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'An unexpected error occurred while saving your review.';
    }

    const body: unknown = error.error;
    if (typeof body === 'object' && body !== null) {
      const code = 'code' in body && typeof body.code === 'string' ? body.code : '';
      const detail = 'detail' in body && typeof body.detail === 'string' ? body.detail : '';
      const validationMessages: string[] = [];

      if ('errors' in body && typeof body.errors === 'object' && body.errors !== null) {
        for (const messages of Object.values(body.errors)) {
          if (Array.isArray(messages)) {
            validationMessages.push(
              ...messages.filter((message): message is string => typeof message === 'string'),
            );
          }
        }
      }

      if (error.status === 409 && code === 'review_exists') {
        return 'You have already reviewed this product.';
      }
      if (error.status === 401) {
        return 'Sign in again to write a review.';
      }
      if (error.status === 403) {
        return detail || 'You are not allowed to perform this action.';
      }
      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }
      if (detail) {
        return detail;
      }
    }

    return error.message || 'An unexpected error occurred while saving your review.';
  }

  private getErrorMessage(error: unknown, context: 'product' | 'reviews' = 'product'): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (
        typeof body === 'object' &&
        body !== null &&
        'detail' in body &&
        typeof body.detail === 'string'
      ) {
        return body.detail;
      }

      return error.message;
    }

    return context === 'reviews'
      ? 'An unexpected error occurred while loading reviews.'
      : 'An unexpected error occurred while loading product details.';
  }
}
