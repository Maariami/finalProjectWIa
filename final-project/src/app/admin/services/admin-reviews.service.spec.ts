import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminReviewsService } from './admin-reviews.service';

describe('AdminReviewsService', () => {
  let service: AdminReviewsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminReviewsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses the admin reviews endpoint, filters, and delete method', () => {
    service.getReviews({
      page: 2,
      pageSize: 10,
      productId: 'product-id',
      userId: 'user-id',
      rating: 5,
    }).subscribe();
    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/api/admin/reviews?Page=2&PageSize=10&ProductId=product-id&UserId=user-id&Rating=5`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [],
      page: 2,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    service.deleteReview('review-id').subscribe();
    const deleteRequest = httpTestingController.expectOne(
      `${API_BASE_URL}/api/admin/reviews/review-id`,
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
  });
});
