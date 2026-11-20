import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { AdminDashboard } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${API_BASE_URL}/api/admin/dashboard`);
  }
}
