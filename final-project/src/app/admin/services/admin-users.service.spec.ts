import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUsersService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('uses the user query, detail, and administration endpoints', () => {
    const baseUrl = `${API_BASE_URL}/api/admin/users`;
    service.getUsers({
      search: 'jane',
      role: 'Customer',
      isBlocked: false,
      emailConfirmed: true,
      sort: 'EmailAsc',
      page: 2,
      pageSize: 20,
    }).subscribe();
    let request = httpTestingController.expectOne(
      `${baseUrl}?Search=jane&Role=Customer&IsBlocked=false&EmailConfirmed=true&Sort=EmailAsc&Page=2&PageSize=20`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });

    const user = {
      id: 'user-id',
      email: 'person@example.com',
      firstName: 'First',
      lastName: 'Last',
      fullName: 'First Last',
      phoneNumber: null,
      avatarUrl: null,
      role: 'Customer',
      emailConfirmed: true,
      isBlocked: false,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: null,
      reviewCount: 0,
      favoriteCount: 0,
      cartItemCount: 0,
    };

    service.getUser(user.id).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/user-id`);
    expect(request.request.method).toBe('GET');
    request.flush(user);

    service.createUser({
      email: user.email,
      password: 'NotLogged',
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'Customer',
    }).subscribe();
    request = httpTestingController.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: user.email,
      password: 'NotLogged',
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'Customer',
    });
    request.flush(user, { status: 201, statusText: 'Created' });

    service.changeRole(user.id, 'Admin').subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/user-id/role`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ role: 'Admin' });
    request.flush({ ...user, role: 'Admin' });

    for (const [path, action] of [
      ['block', () => service.blockUser(user.id)],
      ['unblock', () => service.unblockUser(user.id)],
      ['confirm-email', () => service.confirmUserEmail(user.id)],
    ] as const) {
      action().subscribe();
      request = httpTestingController.expectOne(`${baseUrl}/user-id/${path}`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toBeNull();
      request.flush(user);
    }

    service.deleteUser(user.id).subscribe();
    request = httpTestingController.expectOne(`${baseUrl}/user-id`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
