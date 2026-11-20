import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminBanner } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminBannersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/admin/banners`;

  getBanners(isActive?: boolean): Observable<AdminBanner[]> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('isActive', isActive);
    return this.http.get<AdminBanner[]>(this.baseUrl, { params });
  }

  getBanner(id: string): Observable<AdminBanner> {
    return this.http.get<AdminBanner>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  createBanner(formData: FormData): Observable<AdminBanner> {
    return this.http.post<AdminBanner>(this.baseUrl, formData);
  }

  updateBanner(id: string, formData: FormData): Observable<AdminBanner> {
    return this.http.put<AdminBanner>(`${this.baseUrl}/${encodeURIComponent(id)}`, formData);
  }

  deleteBanner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
