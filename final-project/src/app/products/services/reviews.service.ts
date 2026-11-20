import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { ProductReviews, Review, ReviewQueryParams, ReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getProductReviews(
    productId: string,
    query: ReviewQueryParams = {},
  ): Observable<ProductReviews> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('Page', query.page);
    if (query.pageSize !== undefined) params = params.set('PageSize', query.pageSize);
    if (query.rating !== undefined) params = params.set('Rating', query.rating);

    return this.http.get<ProductReviews>(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/reviews`,
      { params },
    );
  }

  createReview(productId: string, request: ReviewRequest): Observable<Review> {
    return this.http.post<Review>(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/reviews`,
      request,
    );
  }

  getMyReview(productId: string): Observable<Review> {
    return this.http.get<Review>(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/reviews/mine`,
    );
  }

  updateReview(productId: string, reviewId: string, request: ReviewRequest): Observable<Review> {
    return this.http.put<Review>(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
      request,
    );
  }

  deleteReview(productId: string, reviewId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
    );
  }
}
