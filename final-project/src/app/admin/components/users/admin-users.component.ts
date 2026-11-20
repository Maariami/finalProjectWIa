import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { PagedResult } from '../../../products/models/product.model';
import { AdminUser, AdminUserSort } from '../../models/admin.model';
import { AdminUsersService } from '../../services/admin-users.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly result = signal<PagedResult<AdminUser> | null>(null);
  protected readonly loading = signal(true);
  protected readonly creating = signal(false);
  protected readonly showCreateForm = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly createError = signal<string | null>(null);
  private page = 1;
  private readonly pageSize = 20;
  private filters = {
    search: '',
    role: '' as 'Customer' | 'Admin' | '',
    isBlocked: null as boolean | null,
    emailConfirmed: null as boolean | null,
    sort: 'Newest' as AdminUserSort,
  };

  protected readonly filterForm = this.formBuilder.group({
    search: this.formBuilder.nonNullable.control(''),
    role: this.formBuilder.nonNullable.control<'Customer' | 'Admin' | ''>(''),
    isBlocked: this.formBuilder.control<boolean | null>(null),
    emailConfirmed: this.formBuilder.control<boolean | null>(null),
    sort: this.formBuilder.nonNullable.control<AdminUserSort>('Newest'),
  });

  protected readonly createForm = this.formBuilder.group({
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [Validators.required]),
    firstName: this.formBuilder.nonNullable.control('', [Validators.required]),
    lastName: this.formBuilder.nonNullable.control('', [Validators.required]),
    role: this.formBuilder.nonNullable.control<'Customer' | 'Admin'>('Customer', [Validators.required]),
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected applyFilters(): void {
    const form = this.filterForm.getRawValue();
    this.filters = {
      search: form.search.trim(),
      role: form.role,
      isBlocked: form.isBlocked,
      emailConfirmed: form.emailConfirmed,
      sort: form.sort,
    };
    this.page = 1;
    this.loadUsers();
  }

  protected clearFilters(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      isBlocked: null,
      emailConfirmed: null,
      sort: 'Newest',
    });
    this.filters = {
      search: '',
      role: '',
      isBlocked: null,
      emailConfirmed: null,
      sort: 'Newest',
    };
    this.page = 1;
    this.loadUsers();
  }

  protected changePage(page: number): void {
    this.page = page;
    this.loadUsers();
  }

  protected createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.usersService
      .createUser(this.createForm.getRawValue())
      .pipe(
        tap(() => {
          this.createForm.reset({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: 'Customer',
          });
          this.showCreateForm.set(false);
          this.loadUsers();
        }),
        catchError((error: unknown) => {
          this.createError.set(readAdminApiError(error, 'Could not create this user.'));
          return EMPTY;
        }),
        finalize(() => this.creating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.usersService
      .getUsers({
        search: this.filters.search || undefined,
        role: this.filters.role || undefined,
        isBlocked: this.filters.isBlocked ?? undefined,
        emailConfirmed: this.filters.emailConfirmed ?? undefined,
        sort: this.filters.sort,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(
        tap((result) => {
          this.result.set(result);
          this.loading.set(false);
          if (this.page > result.totalPages && result.totalPages > 0) {
            this.page = result.totalPages;
            this.loadUsers();
          }
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(
            error instanceof HttpErrorResponse
              ? readAdminApiError(error, 'Could not load users.')
              : 'An unexpected error occurred while loading users.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
