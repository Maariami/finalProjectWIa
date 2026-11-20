import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('uses the review endpoints and methods', () => {
    const productId = 'product-id';
    const reviewId = 'review-id';

    service.getProductReviews(productId, { page: 2, pageSize: 5, rating: 4 }).subscribe();
    let request = httpTestingController.expectOne(
      `${API_BASE_URL}/api/products/product-id/reviews?Page=2&PageSize=5&Rating=4`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      reviews: { items: [], page: 2, pageSize: 5, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      averageRating: 0,
      reviewCount: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    });

    service.createReview(productId, { rating: 5, comment: 'Excellent' }).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/products/product-id/reviews`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rating: 5, comment: 'Excellent' });
    request.flush({});

    service.getMyReview(productId).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/products/product-id/reviews/mine`);
    expect(request.request.method).toBe('GET');
    request.flush({});

    service.updateReview(productId, reviewId, { rating: 4, comment: null }).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/products/product-id/reviews/review-id`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ rating: 4, comment: null });
    request.flush({});

    service.deleteReview(productId, reviewId).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/products/product-id/reviews/review-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
