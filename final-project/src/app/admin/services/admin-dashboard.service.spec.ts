import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminDashboard } from '../models/admin.model';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminDashboardService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('fetches the administrative dashboard', () => {
    const response = {
      totalUsers: 10,
      totalAdmins: 1,
      blockedUsers: 0,
      newUsersLast7Days: 2,
      newUsersLast30Days: 5,
      totalProducts: 20,
      activeProducts: 18,
      outOfStockProducts: 1,
      totalCategories: 4,
      activeBanners: 2,
      totalReviews: 8,
      totalViews: 100,
      topViewedProducts: [],
      topRatedProducts: [],
      lowStockProducts: [],
      productsPerCategory: [],
    };
    let result: AdminDashboard | undefined;

    service.getDashboard().subscribe((dashboard) => {
      result = dashboard;
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/api/admin/dashboard`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(result).toEqual(response);
  });
});
