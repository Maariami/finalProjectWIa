import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProductBrandFacet,
  ProductFilters,
  ProductListItem,
  ProductQueryParams,
} from '../../models/product.model';
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
  private filterRequestId = 0;

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly filters = signal<ProductFilters | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly filtersLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly filtersErrorMessage = signal<string | null>(null);
  protected readonly priceErrorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly categoryId = signal('');
  protected readonly selectedBrands = signal<string[]>([]);
  protected readonly minPrice = signal<number | undefined>(undefined);
  protected readonly maxPrice = signal<number | undefined>(undefined);
  protected readonly minRating = signal<number | undefined>(undefined);
  protected readonly inStock = signal<boolean | undefined>(undefined);
  protected readonly onSale = signal(false);

  ngOnInit(): void {
    this.loadFilters();
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

  protected onCategoryChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.categoryId.set(event.target.value);
    this.loadFilters(this.categoryId() || undefined);
    this.resetAndLoadProducts();
  }

  protected onBrandSelection(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.value) return;
    const brand = event.target.value;
    const brands = this.selectedBrands();
    this.selectedBrands.set(
      brands.includes(brand)
        ? brands.filter((selected) => selected !== brand)
        : [...brands, brand],
    );
    event.target.value = '';
    this.resetAndLoadProducts();
  }

  protected onMinPriceChange(event: Event): void {
    this.minPrice.set(this.getNumberValue(event));
    this.resetAndLoadProducts();
  }

  protected onMaxPriceChange(event: Event): void {
    this.maxPrice.set(this.getNumberValue(event));
    this.resetAndLoadProducts();
  }

  protected onMinRatingChange(event: Event): void {
    this.minRating.set(this.getNumberValue(event));
    this.resetAndLoadProducts();
  }

  protected onStockChange(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const value = event.target.value;
    this.inStock.set(value === '' ? undefined : value === 'true');
    this.resetAndLoadProducts();
  }

  protected onSaleChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.onSale.set(event.target.checked);
    this.resetAndLoadProducts();
  }

  protected clearFilters(): void {
    this.categoryId.set('');
    this.selectedBrands.set([]);
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.minRating.set(undefined);
    this.inStock.set(undefined);
    this.onSale.set(false);
    this.priceErrorMessage.set(null);
    this.loadFilters();
    this.resetAndLoadProducts();
  }

  protected retryFilters(): void {
    this.loadFilters(this.categoryId() || undefined);
  }

  protected getAvailableBrands(): ProductBrandFacet[] {
    const brands = [...(this.filters()?.brands ?? [])];
    for (const brand of this.selectedBrands()) {
      if (!brands.some((facet) => facet.name === brand)) {
        brands.push({ name: brand, count: 0 });
      }
    }
    return brands;
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
    if (this.priceErrorMessage()) return;
    this.loadPage(this.currentPage());
  }

  private resetAndLoadProducts(): void {
    this.clearSearchDebounce();
    this.priceErrorMessage.set(null);
    const minPrice = this.minPrice();
    const maxPrice = this.maxPrice();
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      this.priceErrorMessage.set('Minimum price cannot be greater than maximum price.');
      this.requestId += 1;
      this.products.set([]);
      this.totalCount.set(0);
      this.totalPages.set(0);
      this.errorMessage.set(null);
      this.loading.set(false);
      return;
    }
    this.loadPage(1);
  }

  private loadFilters(categoryId?: string): void {
    const requestId = ++this.filterRequestId;
    this.filtersLoading.set(true);
    this.filtersErrorMessage.set(null);

    this.productsService
      .getProductFilters(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (requestId !== this.filterRequestId) return;
          this.filters.set(result);
          this.filtersLoading.set(false);
        },
        error: (error: unknown) => {
          if (requestId !== this.filterRequestId) return;
          this.filtersErrorMessage.set(this.getErrorMessage(error));
          this.filtersLoading.set(false);
        },
      });
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
    if (this.categoryId()) query.categoryId = this.categoryId();
    if (this.selectedBrands().length > 0) query.brands = this.selectedBrands();
    if (this.minPrice() !== undefined) query.minPrice = this.minPrice();
    if (this.maxPrice() !== undefined) query.maxPrice = this.maxPrice();
    if (this.minRating() !== undefined) query.minRating = this.minRating();
    if (this.inStock() !== undefined) query.inStock = this.inStock();
    if (this.onSale()) query.onSale = true;

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

  private getNumberValue(event: Event): number | undefined {
    const target = event.target;
    if (
      (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) ||
      target.value === ''
    ) {
      return undefined;
    }
    const value = Number(target.value);
    return Number.isFinite(value) ? value : undefined;
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
