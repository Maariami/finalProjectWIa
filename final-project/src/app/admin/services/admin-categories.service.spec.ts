import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminCategoriesService } from './admin-categories.service';

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminCategoriesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses the public list and administrative category mutation endpoints', () => {
    const category = {
      id: 'category-id',
      name: 'Audio',
      slug: 'audio',
      description: null,
      productCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    };
    const requestBody = { name: 'Audio', description: null };
    service.getCategories().subscribe();
    let request = httpTestingController.expectOne(`${API_BASE_URL}/api/categories`);
    expect(request.request.method).toBe('GET');
    request.flush([category]);

    service.createCategory(requestBody).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/admin/categories`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(category);

    service.updateCategory(category.id, requestBody).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/admin/categories/category-id`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(requestBody);
    request.flush(category);

    service.deleteCategory(category.id).subscribe();
    request = httpTestingController.expectOne(`${API_BASE_URL}/api/admin/categories/category-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
