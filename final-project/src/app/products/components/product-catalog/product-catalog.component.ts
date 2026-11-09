import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductListItem } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-catalog',
  imports: [DecimalPipe],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss',
})
export class ProductCatalogComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 12;

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPage(1);
  }

  protected goToPage(page: number): void {
    if (this.loading() || page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }

  protected retry(): void {
    this.loadPage(this.currentPage());
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productsService
      .getProducts({ page, pageSize: this.pageSize })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.currentPage.set(result.page);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error));
          this.loading.set(false);
        },
      });
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
