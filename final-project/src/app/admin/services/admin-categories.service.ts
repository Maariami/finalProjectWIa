import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminCategory, AdminCategoryRequest } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.baseUrl}/api/categories`);
  }

  createCategory(request: AdminCategoryRequest): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${this.baseUrl}/api/admin/categories`, request);
  }

  updateCategory(id: string, request: AdminCategoryRequest): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(
      `${this.baseUrl}/api/admin/categories/${encodeURIComponent(id)}`,
      request,
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/admin/categories/${encodeURIComponent(id)}`);
  }
}
