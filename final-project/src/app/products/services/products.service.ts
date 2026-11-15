import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PagedResult,
  ProductDetails,
  ProductFilters,
  ProductListItem,
  ProductQueryParams,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://wtm-2026-final-production.up.railway.app';

  getProducts(query: ProductQueryParams = {}): Observable<PagedResult<ProductListItem>> {
    let params = new HttpParams();

    if (query.search !== undefined) params = params.set('search', query.search);
    if (query.categoryId !== undefined) params = params.set('categoryId', query.categoryId);
    for (const brand of query.brands ?? []) {
      params = params.append('brands', brand);
    }
    if (query.minPrice !== undefined) params = params.set('minPrice', query.minPrice);
    if (query.maxPrice !== undefined) params = params.set('maxPrice', query.maxPrice);
    if (query.minRating !== undefined) params = params.set('minRating', query.minRating);
    if (query.inStock !== undefined) params = params.set('inStock', query.inStock);
    if (query.onSale !== undefined) params = params.set('onSale', query.onSale);
    if (query.sort !== undefined) params = params.set('sort', query.sort);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResult<ProductListItem>>(`${this.baseUrl}/api/products`, { params });
  }

  getProductFilters(categoryId?: string): Observable<ProductFilters> {
    let params = new HttpParams();
    if (categoryId !== undefined) params = params.set('categoryId', categoryId);

    return this.http.get<ProductFilters>(`${this.baseUrl}/api/products/filters`, { params });
  }

  getProductByIdOrSlug(idOrSlug: string): Observable<ProductDetails> {
    const encodedIdOrSlug = encodeURIComponent(idOrSlug);
    return this.http.get<ProductDetails>(
      `${this.baseUrl}/api/products/${encodedIdOrSlug}`,
    );
  }
}
