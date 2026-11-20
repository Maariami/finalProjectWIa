import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, EMPTY, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ProductDetails, ProductImage } from '../../../products/models/product.model';
import { AdminCategory } from '../../models/admin.model';
import { AdminCategoriesService } from '../../services/admin-categories.service';
import { AdminProductsService } from '../../services/admin-products.service';
import { readAdminApiError } from '../../utils/admin-api-error';

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
})
export class AdminProductFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesService = inject(AdminCategoriesService);
  private readonly productsService = inject(AdminProductsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly product = signal<ProductDetails | null>(null);
  protected readonly createMode = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);

  protected readonly productForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(150),
    ]),
    description: this.formBuilder.nonNullable.control('', [Validators.maxLength(4000)]),
    sku: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[A-Za-z0-9-]{3,50}$/),
    ]),
    brand: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(60),
    ]),
    price: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    oldPrice: this.formBuilder.control<number | null>(null, [Validators.min(0)]),
    stock: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    categoryId: this.formBuilder.nonNullable.control('', [Validators.required]),
    isActive: this.formBuilder.nonNullable.control(true),
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap((id) => {
          this.loading.set(true);
          this.product.set(null);
          this.errorMessage.set(null);
          this.successMessage.set(null);
          this.createMode.set(id === 'new');
        }),
        switchMap((id) =>
          forkJoin({
            categories: this.categoriesService.getCategories(),
            product: id && id !== 'new' ? this.productsService.getProduct(id) : of(null),
          }).pipe(
            tap(({ categories, product }) => {
              this.categories.set(categories);
              this.product.set(product);
              this.loading.set(false);
              if (product) {
                this.productForm.reset({
                  name: product.name,
                  description: product.description,
                  sku: product.sku,
                  brand: product.brand,
                  price: product.price,
                  oldPrice: product.oldPrice,
                  stock: product.stock,
                  categoryId: product.category.id,
                  isActive: product.isActive,
                });
              } else {
                this.productForm.reset({
                  name: '',
                  description: '',
                  sku: '',
                  brand: '',
                  price: 0,
                  oldPrice: null,
                  stock: 0,
                  categoryId: '',
                  isActive: true,
                });
              }
            }),
            catchError((error: unknown) => {
              this.loading.set(false);
              this.errorMessage.set(
                error instanceof HttpErrorResponse
                  ? readAdminApiError(error, 'Could not load product information.')
                  : 'An unexpected error occurred while loading product information.',
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const form = this.productForm.getRawValue();
    const request = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      sku: form.sku.trim(),
      brand: form.brand.trim(),
      oldPrice: form.oldPrice && form.oldPrice > 0 ? form.oldPrice : null,
    };
    const product = this.product();
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const saveRequest = product
      ? this.productsService.updateProduct(product.id, request)
      : this.productsService.createProduct(request);

    saveRequest
      .pipe(
        tap((savedProduct) => {
          this.product.set(savedProduct);
          this.successMessage.set('Product saved.');
          if (!product) {
            this.router.navigate(['/admin/products', savedProduct.id]);
          }
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(readAdminApiError(error, 'Could not save this product.'));
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected selectImages(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    this.selectedFiles.set(Array.from(input.files ?? []));
    this.imageError.set(null);
  }

  protected uploadImages(): void {
    const product = this.product();
    const files = this.selectedFiles();
    if (!product || files.length === 0) return;

    this.uploading.set(true);
    this.imageError.set(null);
    this.productsService
      .uploadImages(product.id, files)
      .pipe(
        tap((images) => {
          this.updateImages(images);
          this.selectedFiles.set([]);
          this.successMessage.set('Product images uploaded.');
        }),
        catchError((error: unknown) => {
          this.imageError.set(readAdminApiError(error, 'Could not upload product images.'));
          return EMPTY;
        }),
        finalize(() => this.uploading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected deleteImage(image: ProductImage): void {
    const product = this.product();
    if (!product || !window.confirm('Delete this product image?')) return;

    this.imageError.set(null);
    this.productsService
      .deleteImage(product.id, image.id)
      .pipe(
        tap((images) => this.updateImages(images)),
        catchError((error: unknown) => {
          this.imageError.set(readAdminApiError(error, 'Could not delete this image.'));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected makePrimary(image: ProductImage): void {
    const product = this.product();
    if (!product || image.isPrimary) return;

    this.imageError.set(null);
    this.productsService
      .setPrimaryImage(product.id, image.id)
      .pipe(
        tap((images) => this.updateImages(images)),
        catchError((error: unknown) => {
          this.imageError.set(readAdminApiError(error, 'Could not set the primary image.'));
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private updateImages(images: ProductImage[]): void {
    const product = this.product();
    if (product) this.product.set({ ...product, images });
  }
}
