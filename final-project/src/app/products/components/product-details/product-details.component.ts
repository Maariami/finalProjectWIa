import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { ProductsService } from '../../services/products.service';
import { ReviewsService } from '../../services/reviews.service';
import { ProductDetails } from '../../models/product.model';
import { ProductReviews } from '../../models/review.model';

@Component({
  selector: 'app-product-details',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly product = signal<ProductDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly productReviews = signal<ProductReviews | null>(null);
  protected readonly reviewsLoading = signal(false);
  protected readonly reviewsError = signal<string | null>(null);

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

  protected distributionCount(star: number): number {
    const distribution = this.productReviews()?.distribution;
    if (!distribution) return 0;
    return distribution[String(star) as '1' | '2' | '3' | '4' | '5'];
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
