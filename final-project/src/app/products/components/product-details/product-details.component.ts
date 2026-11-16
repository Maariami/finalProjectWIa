import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { ProductsService } from '../../services/products.service';
import { ProductDetails } from '../../models/product.model';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly product = signal<ProductDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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

  private getErrorMessage(error: unknown): string {
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

    return 'An unexpected error occurred while loading product details.';
  }
}
