import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { AdminCategory } from '../../models/admin.model';
import { AdminCategoriesService } from '../../services/admin-categories.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categoriesService = inject(AdminCategoriesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly editingCategory = signal<AdminCategory | null>(null);

  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const editing = this.editingCategory();
    const { name, description } = this.categoryForm.getRawValue();
    const request = {
      name: name.trim(),
      description: description.trim() || null,
    };

    this.saving.set(true);
    this.formError.set(null);
    const operation = editing
      ? this.categoriesService.updateCategory(editing.id, request)
      : this.categoriesService.createCategory(request);

    operation
      .pipe(
        tap(() => {
          this.cancelEdit();
          this.loadCategories();
        }),
        catchError((error: unknown) => {
          this.formError.set(readAdminApiError(error, 'Could not save this category.'));
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected editCategory(category: AdminCategory): void {
    this.editingCategory.set(category);
    this.formError.set(null);
    this.categoryForm.reset({
      name: category.name,
      description: category.description ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingCategory.set(null);
    this.formError.set(null);
    this.categoryForm.reset({ name: '', description: '' });
  }

  protected deleteCategory(category: AdminCategory): void {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    this.deletingId.set(category.id);
    this.errorMessage.set(null);
    this.categoriesService
      .deleteCategory(category.id)
      .pipe(
        tap(() => this.loadCategories()),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not delete this category.'));
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.categoriesService
      .getCategories()
      .pipe(
        tap((categories) => {
          this.categories.set(categories);
          this.loading.set(false);
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          if (error instanceof HttpErrorResponse) {
            this.errorMessage.set(readAdminApiError(error, 'Could not load categories.'));
          } else {
            this.errorMessage.set('An unexpected error occurred while loading categories.');
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
