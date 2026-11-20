import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { PagedResult, ProductListItem } from '../../../products/models/product.model';
import { AdminProductsService } from '../../services/admin-products.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-products',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly productsService = inject(AdminProductsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly result = signal<PagedResult<ProductListItem> | null>(null);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly activeFilter = signal('');
  private page = 1;
  private readonly pageSize = 20;

  ngOnInit(): void {
    this.loadProducts();
  }

  protected searchProducts(value: string): void {
    this.search.set(value.trim());
    this.page = 1;
    this.loadProducts();
  }

  protected filterActive(value: string): void {
    this.activeFilter.set(value);
    this.page = 1;
    this.loadProducts();
  }

  protected changePage(page: number): void {
    this.page = page;
    this.loadProducts();
  }

  protected deleteProduct(product: ProductListItem): void {
    if (!window.confirm(`Delete "${product.name}"? This will remove it from the public catalog.`)) return;

    this.deletingId.set(product.id);
    this.errorMessage.set(null);
    this.productsService
      .deleteProduct(product.id)
      .pipe(
        tap(() => this.loadProducts()),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not delete this product.'));
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const activeValue = this.activeFilter();
    this.productsService
      .getProducts({
        page: this.page,
        pageSize: this.pageSize,
        search: this.search() || undefined,
        isActive: activeValue === '' ? undefined : activeValue === 'true',
      })
      .pipe(
        tap((result) => {
          this.result.set(result);
          this.loading.set(false);
          if (this.page > result.totalPages && result.totalPages > 0) {
            this.page = result.totalPages;
            this.loadProducts();
          }
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(
            error instanceof HttpErrorResponse
              ? readAdminApiError(error, 'Could not load products.')
              : 'An unexpected error occurred while loading products.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
