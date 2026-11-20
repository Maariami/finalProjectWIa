import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminBannersService } from './admin-banners.service';

describe('AdminBannersService', () => {
  let service: AdminBannersService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminBannersService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses the banner list, detail, multipart mutation, and delete endpoints', () => {
    const baseUrl = `${API_BASE_URL}/api/admin/banners`;
    const banner = {
      id: 'banner-id',
      title: 'Sale',
      subtitle: null,
      imageUrl: '/sale.webp',
      linkUrl: '/products',
      sortOrder: 0,
      isActive: true,
      startsAt: null,
      endsAt: null,
      isCurrentlyVisible: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
    };
    const formData = new FormData();
    formData.append('Title', 'Sale');
    formData.append('Image', new File(['image'], 'sale.webp', { type: 'image/webp' }));

    service.getBanners(false).subscribe();
    let request = httpTestingController.expectOne(`${baseUrl}?isActive=false`);
    expect(request.request.method).toBe('GET');
    request.flush([]);

    service.getBanner(banner.id).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/banner-id`);
    expect(request.request.method).toBe('GET');
    request.flush(banner);

    service.createBanner(formData).subscribe();
    request = httpTestingController.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(formData);
    request.flush(banner);

    service.updateBanner(banner.id, formData).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/banner-id`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBe(formData);
    request.flush(banner);

    service.deleteBanner(banner.id).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/banner-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
