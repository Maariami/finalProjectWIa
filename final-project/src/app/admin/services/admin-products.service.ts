import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { ProductDetails, ProductImage, ProductListItem, PagedResult } from '../../products/models/product.model';
import { AdminProductRequest, AdminProductsQuery } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/admin/products`;

  getProducts(query: AdminProductsQuery = {}): Observable<PagedResult<ProductListItem>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('Page', query.page);
    if (query.pageSize !== undefined) params = params.set('PageSize', query.pageSize);
    if (query.isActive !== undefined) params = params.set('IsActive', query.isActive);
    if (query.search) params = params.set('Search', query.search);
    if (query.categoryId) params = params.set('CategoryId', query.categoryId);

    return this.http.get<PagedResult<ProductListItem>>(this.baseUrl, { params });
  }

  getProduct(id: string): Observable<ProductDetails> {
    return this.http.get<ProductDetails>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  createProduct(request: AdminProductRequest): Observable<ProductDetails> {
    return this.http.post<ProductDetails>(this.baseUrl, request);
  }

  updateProduct(id: string, request: AdminProductRequest): Observable<ProductDetails> {
    return this.http.put<ProductDetails>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  uploadImages(id: string, files: File[]): Observable<ProductImage[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<ProductImage[]>(
      `${this.baseUrl}/${encodeURIComponent(id)}/images`,
      formData,
    );
  }

  deleteImage(id: string, imageId: string): Observable<ProductImage[]> {
    return this.http.delete<ProductImage[]>(
      `${this.baseUrl}/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
    );
  }

  setPrimaryImage(id: string, imageId: string): Observable<ProductImage[]> {
    return this.http.put<ProductImage[]>(
      `${this.baseUrl}/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}/primary`,
      null,
    );
  }
}
