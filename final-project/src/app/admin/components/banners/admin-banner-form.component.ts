import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, EMPTY, finalize, map, of, switchMap, tap } from 'rxjs';
import { AdminBanner } from '../../models/admin.model';
import { AdminBannersService } from '../../services/admin-banners.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-banner-form',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-banner-form.component.html',
  styleUrl: './admin-banner-form.component.scss',
})
export class AdminBannerFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bannersService = inject(AdminBannersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly banner = signal<AdminBanner | null>(null);
  protected readonly createMode = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly bannerForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]),
    subtitle: this.formBuilder.nonNullable.control('', [Validators.maxLength(200)]),
    linkUrl: this.formBuilder.nonNullable.control('', [Validators.maxLength(2048)]),
    sortOrder: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0), Validators.max(10000)]),
    isActive: this.formBuilder.nonNullable.control(true),
    startsAt: this.formBuilder.nonNullable.control(''),
    endsAt: this.formBuilder.nonNullable.control(''),
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap((id) => {
          this.loading.set(true);
          this.errorMessage.set(null);
          this.successMessage.set(null);
          this.createMode.set(id === 'new');
        }),
        switchMap((id) =>
          id && id !== 'new' ? this.bannersService.getBanner(id).pipe(map((banner) => ({ banner }))) : of({ banner: null }),
        ),
        tap(({ banner }) => {
          this.banner.set(banner);
          this.loading.set(false);
          if (banner) {
            this.bannerForm.reset({
              title: banner.title,
              subtitle: banner.subtitle ?? '',
              linkUrl: banner.linkUrl ?? '',
              sortOrder: banner.sortOrder,
              isActive: banner.isActive,
              startsAt: this.toLocalDateTime(banner.startsAt),
              endsAt: this.toLocalDateTime(banner.endsAt),
            });
          } else {
            this.bannerForm.reset({
              title: '',
              subtitle: '',
              linkUrl: '',
              sortOrder: 0,
              isActive: true,
              startsAt: '',
              endsAt: '',
            });
          }
        }),
        catchError((error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(
            error instanceof HttpErrorResponse
              ? readAdminApiError(error, 'Could not load this banner.')
              : 'An unexpected error occurred while loading this banner.',
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected selectImage(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const image = input.files?.[0] ?? null;
    this.selectedImage.set(image);
    if (image && !this.isValidImage(image)) {
      this.errorMessage.set('Choose a JPEG, PNG, or WEBP image no larger than 5 MB.');
    } else {
      this.errorMessage.set(null);
    }
  }

  protected saveBanner(): void {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      return;
    }

    const image = this.selectedImage();
    if (this.createMode() && !image) {
      this.errorMessage.set('Select an image to create a banner.');
      return;
    }
    if (image && !this.isValidImage(image)) {
      this.errorMessage.set('Choose a JPEG, PNG, or WEBP image no larger than 5 MB.');
      return;
    }

    const form = this.bannerForm.getRawValue();
    const body = new FormData();
    body.append('Title', form.title.trim());
    body.append('Subtitle', form.subtitle.trim());
    body.append('LinkUrl', form.linkUrl.trim());
    body.append('SortOrder', String(form.sortOrder));
    body.append('IsActive', String(form.isActive));
    const startsAt = this.toUtcIso(form.startsAt);
    const endsAt = this.toUtcIso(form.endsAt);
    if (startsAt) body.append('StartsAt', startsAt);
    if (endsAt) body.append('EndsAt', endsAt);
    if (image) body.append('Image', image, image.name);

    const banner = this.banner();
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const request = banner
      ? this.bannersService.updateBanner(banner.id, body)
      : this.bannersService.createBanner(body);

    request
      .pipe(
        tap((saved) => {
          this.banner.set(saved);
          this.successMessage.set('Banner saved.');
          if (!banner) this.router.navigate(['/admin/banners', saved.id]);
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not save this banner.'));
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private isValidImage(file: File): boolean {
    return (
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
      file.size <= 5 * 1024 * 1024
    );
  }

  private toLocalDateTime(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private toUtcIso(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }
}
