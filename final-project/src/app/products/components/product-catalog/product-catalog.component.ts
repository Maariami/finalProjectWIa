import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductListItem, ProductQueryParams } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-catalog',
  imports: [DecimalPipe],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss',
})
export class ProductCatalogComponent implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 12;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  ngOnInit(): void {
    this.loadPage(1);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  protected onSearchChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.searchQuery.set(event.target.value);
    this.clearSearchDebounce();
    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = null;
      this.loadPage(1);
    }, 300);
  }

  protected goToPage(page: number): void {
    if (this.searchDebounceTimer !== null) {
      this.loadPage(1);
      return;
    }
    if (this.loading() || page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }

  protected retry(): void {
    this.loadPage(this.currentPage());
  }

  private loadPage(page: number): void {
    const requestId = ++this.requestId;
    this.products.set([]);
    this.totalCount.set(0);
    this.totalPages.set(0);
    this.currentPage.set(page);
    this.loading.set(true);
    this.errorMessage.set(null);

    const query: ProductQueryParams = { page, pageSize: this.pageSize };
    const search = this.searchQuery().trim();
    if (search) query.search = search;

    this.productsService
      .getProducts(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (requestId !== this.requestId) return;
          this.products.set(result.items);
          this.currentPage.set(result.page);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (requestId !== this.requestId) return;
          this.errorMessage.set(this.getErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
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

    return 'An unexpected error occurred while loading products.';
  }
}
