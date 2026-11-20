import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminProductsService } from './admin-products.service';

describe('AdminProductsService', () => {
  let service: AdminProductsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminProductsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses admin product endpoints and repeated multipart file fields', () => {
    const baseUrl = `${API_BASE_URL}/api/admin/products`;
    const productId = 'product-id';
    const imageId = 'image-id';

    service.getProducts({ page: 2, pageSize: 10, isActive: false }).subscribe();
    let request = httpTestingController.expectOne(`${baseUrl}?Page=2&PageSize=10&IsActive=false`);
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, pageSize: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });

    service.getProduct(productId).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id`);
    expect(request.request.method).toBe('GET');
    request.flush({});

    service.createProduct({
      name: 'Product',
      description: '',
      sku: 'PRD-1',
      brand: 'Brand',
      price: 10,
      oldPrice: null,
      stock: 0,
      categoryId: 'category-id',
      isActive: false,
    }).subscribe();
    request = httpTestingController.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    request.flush({});

    service.updateProduct(productId, {
      name: 'Product',
      description: '',
      sku: 'PRD-1',
      brand: 'Brand',
      price: 10,
      oldPrice: null,
      stock: 0,
      categoryId: 'category-id',
      isActive: false,
    }).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id`);
    expect(request.request.method).toBe('PUT');
    request.flush({});

    service.uploadImages(productId, [
      new File(['first'], 'first.webp', { type: 'image/webp' }),
      new File(['second'], 'second.webp', { type: 'image/webp' }),
    ]).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id/images`);
    expect(request.request.method).toBe('POST');
    const body = request.request.body;
    expect(body).toBeInstanceOf(FormData);
    if (body instanceof FormData) {
      expect(body.getAll('files')).toHaveLength(2);
    }
    request.flush([]);

    service.deleteImage(productId, imageId).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id/images/image-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush([]);

    service.setPrimaryImage(productId, imageId).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id/images/image-id/primary`);
    expect(request.request.method).toBe('PUT');
    request.flush([]);

    service.deleteProduct(productId).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/product-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
