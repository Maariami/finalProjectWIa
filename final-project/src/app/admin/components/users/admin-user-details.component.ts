import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, EMPTY, finalize, map, switchMap, tap } from 'rxjs';
import { AdminUser } from '../../models/admin.model';
import { AdminUsersService } from '../../services/admin-users.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-user-details',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-user-details.component.html',
  styleUrl: './admin-user-details.component.scss',
})
export class AdminUserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(AdminUsersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly user = signal<AdminUser | null>(null);
  protected readonly loading = signal(true);
  protected readonly actionInProgress = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly roleForm = this.formBuilder.nonNullable.group({
    role: this.formBuilder.nonNullable.control<'Customer' | 'Admin'>('Customer', [Validators.required]),
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
          this.successMessage.set(null);
        }),
        switchMap((id) =>
          this.usersService.getUser(id).pipe(
            tap((user) => {
              this.user.set(user);
              this.roleForm.reset({ role: user.role });
              this.loading.set(false);
            }),
            catchError((error: unknown) => {
              this.loading.set(false);
              this.errorMessage.set(
                error instanceof HttpErrorResponse
                  ? readAdminApiError(error, 'Could not load this user.')
                  : 'An unexpected error occurred while loading this user.',
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected changeRole(): void {
    const user = this.user();
    if (!user || this.roleForm.invalid) return;
    this.performAction(
      this.usersService.changeRole(user.id, this.roleForm.getRawValue().role),
      'User role updated.',
    );
  }

  protected blockUser(): void {
    const user = this.user();
    if (!user) return;
    this.performAction(this.usersService.blockUser(user.id), 'User blocked.');
  }

  protected unblockUser(): void {
    const user = this.user();
    if (!user) return;
    this.performAction(this.usersService.unblockUser(user.id), 'User unblocked.');
  }

  protected confirmEmail(): void {
    const user = this.user();
    if (!user) return;
    this.performAction(this.usersService.confirmUserEmail(user.id), 'Email confirmed.');
  }

  protected deleteUser(): void {
    const user = this.user();
    if (
      !user ||
      !window.confirm(
        `Permanently delete ${user.fullName} (${user.email})? This also permanently deletes their reviews, favorites, and cart.`,
      )
    ) {
      return;
    }

    this.actionInProgress.set(true);
    this.errorMessage.set(null);
    this.usersService
      .deleteUser(user.id)
      .pipe(
        tap(() => this.router.navigate(['/admin/users'])),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not delete this user.'));
          return EMPTY;
        }),
        finalize(() => this.actionInProgress.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private performAction(
    request: ReturnType<AdminUsersService['getUser']>,
    successMessage: string,
  ): void {
    this.actionInProgress.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    request
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.roleForm.reset({ role: user.role });
          this.successMessage.set(successMessage);
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not update this user.'));
          return EMPTY;
        }),
        finalize(() => this.actionInProgress.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
