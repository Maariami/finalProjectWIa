import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { PagedResult } from '../../products/models/product.model';
import {
  AdminCreateUserRequest,
  AdminUser,
  AdminUsersQuery,
} from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/admin/users`;

  getUsers(query: AdminUsersQuery = {}): Observable<PagedResult<AdminUser>> {
    let params = new HttpParams();
    if (query.search) params = params.set('Search', query.search);
    if (query.role) params = params.set('Role', query.role);
    if (query.isBlocked !== undefined) params = params.set('IsBlocked', query.isBlocked);
    if (query.emailConfirmed !== undefined) {
      params = params.set('EmailConfirmed', query.emailConfirmed);
    }
    if (query.sort) params = params.set('Sort', query.sort);
    if (query.page !== undefined) params = params.set('Page', query.page);
    if (query.pageSize !== undefined) params = params.set('PageSize', query.pageSize);
    return this.http.get<PagedResult<AdminUser>>(this.baseUrl, { params });
  }

  getUser(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  createUser(request: AdminCreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.baseUrl, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  changeRole(id: string, role: AdminUser['role']): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${encodeURIComponent(id)}/role`, { role });
  }

  blockUser(id: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/${encodeURIComponent(id)}/block`, null);
  }

  unblockUser(id: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/${encodeURIComponent(id)}/unblock`, null);
  }

  confirmUserEmail(id: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      `${this.baseUrl}/${encodeURIComponent(id)}/confirm-email`,
      null,
    );
  }
}
