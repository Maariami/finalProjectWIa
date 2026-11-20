import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { ReviewPagedResult } from '../../products/models/review.model';
import { AdminReviewQuery } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminReviewsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/admin/reviews`;

  getReviews(query: AdminReviewQuery = {}): Observable<ReviewPagedResult> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('Page', query.page);
    if (query.pageSize !== undefined) params = params.set('PageSize', query.pageSize);
    if (query.productId) params = params.set('ProductId', query.productId);
    if (query.userId) params = params.set('UserId', query.userId);
    if (query.rating !== undefined) params = params.set('Rating', query.rating);

    return this.http.get<ReviewPagedResult>(this.baseUrl, { params });
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
