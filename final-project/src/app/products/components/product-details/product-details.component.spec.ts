import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductDetails } from '../../models/product.model';
import { ProductReviews } from '../../models/review.model';
import { ProductsService } from '../../services/products.service';
import { ReviewsService } from '../../services/reviews.service';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { ProductDetailsComponent } from './product-details.component';

const productsService = {
  getProductByIdOrSlug: vi.fn<ProductsService['getProductByIdOrSlug']>(),
};

const reviewsService = {
  getProductReviews: vi.fn<ReviewsService['getProductReviews']>(),
  createReview: vi.fn<ReviewsService['createReview']>(),
  getMyReview: vi.fn<ReviewsService['getMyReview']>(),
  updateReview: vi.fn<ReviewsService['updateReview']>(),
};

const authenticationService = {
  getValidAccessToken: vi.fn<AuthenticationService['getValidAccessToken']>(),
  currentUser: signal(null),
  accessToken: signal(null),
};

const createProduct = (name: string): ProductDetails => ({
  id: name,
  name,
  slug: name,
  description: '',
  sku: '',
  brand: '',
  price: 10,
  oldPrice: null,
  stock: 1,
  isActive: true,
  viewCount: 1,
  averageRating: 0,
  reviewCount: 0,
  category: { id: 'category-id', name: 'Category', slug: 'category' },
  images: [],
  isFavorite: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  inStock: true,
  discountPercent: null,
});

describe('ProductDetailsComponent', () => {
  beforeEach(() => {
    productsService.getProductByIdOrSlug.mockReset();
    reviewsService.getProductReviews.mockReset();
    reviewsService.createReview.mockReset();
    reviewsService.getMyReview.mockReset();
    reviewsService.updateReview.mockReset();
    authenticationService.getValidAccessToken.mockReset();
    authenticationService.getValidAccessToken.mockReturnValue(null);
    authenticationService.currentUser.set(null);
    authenticationService.accessToken.set(null);
    reviewsService.getProductReviews.mockReturnValue(
      of({
        reviews: {
          items: [],
          page: 1,
          pageSize: 100,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        averageRating: 0,
        reviewCount: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      }),
    );
    TestBed.configureTestingModule({
      imports: [ProductDetailsComponent],
      providers: [
        provideRouter([
          {
            path: 'products/:idOrSlug',
            component: ProductDetailsComponent,
          },
        ]),
        { provide: ProductsService, useValue: productsService },
        { provide: ReviewsService, useValue: reviewsService },
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
  });

  it('shows loading and clears stale product data when the route changes', async () => {
    const firstResponse = new Subject<ProductDetails>();
    const secondResponse = new Subject<ProductDetails>();
    productsService.getProductByIdOrSlug.mockImplementation((idOrSlug) =>
      idOrSlug === 'first' ? firstResponse : secondResponse,
    );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/first', ProductDetailsComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Loading product details...');

    await harness.navigateByUrl('/products/second', ProductDetailsComponent);
    expect(productsService.getProductByIdOrSlug).toHaveBeenNthCalledWith(2, 'second');
    firstResponse.next(createProduct('First product'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).not.toContain('First product');

    secondResponse.next(createProduct('Second product'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Second product');
  });

  it('shows not-found and request error states', async () => {
    productsService.getProductByIdOrSlug
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 404 })),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              error: { detail: 'Service unavailable' },
            }),
        ),
      );
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/missing', ProductDetailsComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Product not found');

    await harness.navigateByUrl('/products/unavailable', ProductDetailsComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Product details could not be loaded');
    expect(harness.routeNativeElement?.textContent).toContain('Service unavailable');
  });

  it('displays every product image and the available product information', async () => {
    const product = createProduct('Image product');
    product.brand = 'ShopSphere';
    product.sku = 'SS-001';
    product.description = 'A product with images';
    product.price = 25.5;
    product.oldPrice = 30;
    product.discountPercent = 15;
    product.reviewCount = 2;
    product.averageRating = 4.5;
    product.images = [
      { id: 'image-1', url: '/image-1.jpg', isPrimary: true, sortOrder: 0 },
      { id: 'image-2', url: '/image-2.jpg', isPrimary: false, sortOrder: 1 },
    ];
    productsService.getProductByIdOrSlug.mockReturnValue(of(product));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/image-product', ProductDetailsComponent);

    const images = harness.routeNativeElement?.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images?.[0].getAttribute('src')).toBe('/image-1.jpg');
    expect(harness.routeNativeElement?.textContent).toContain('ShopSphere');
    expect(harness.routeNativeElement?.textContent).toContain('A product with images');
    expect(harness.routeNativeElement?.textContent).toContain('SS-001');
    expect(harness.routeNativeElement?.textContent).toContain('4.5 (2 reviews)');
  });

  it('shows a clean fallback when images and optional values are empty', async () => {
    productsService.getProductByIdOrSlug.mockReturnValue(of(createProduct('No image product')));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/no-image-product', ProductDetailsComponent);

    expect(harness.routeNativeElement?.textContent).toContain('No images available');
    expect(harness.routeNativeElement?.textContent).toContain('Brand not specified');
    expect(harness.routeNativeElement?.textContent).toContain('No description available.');
    expect(harness.routeNativeElement?.textContent).toContain('Not provided');
    expect(harness.routeNativeElement?.textContent).not.toContain('% off');
    expect(harness.routeNativeElement?.textContent).not.toContain('reviews)');
  });

  it('displays review summary, distribution, and review items', async () => {
    const product = createProduct('Reviewed product');
    product.id = 'reviewed-product-id';
    productsService.getProductByIdOrSlug.mockReturnValue(of(product));
    const response: ProductReviews = {
      reviews: {
        items: [
          {
            id: 'review-id',
            productId: product.id,
            productName: product.name,
            rating: 5,
            comment: 'Excellent product',
            author: {
              id: 'author-id',
              fullName: 'Test Customer',
              avatarUrl: null,
            },
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: null,
          },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      averageRating: 5,
      reviewCount: 1,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
    };
    reviewsService.getProductReviews.mockReturnValue(of(response));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/reviewed-product', ProductDetailsComponent);

    expect(reviewsService.getProductReviews).toHaveBeenCalledWith(product.id, {
      page: 1,
      pageSize: 100,
    });
    expect(harness.routeNativeElement?.textContent).toContain('5.0');
    expect(harness.routeNativeElement?.textContent).toContain('1 review');
    expect(harness.routeNativeElement?.textContent).toContain('Test Customer');
    expect(harness.routeNativeElement?.textContent).toContain('Excellent product');
  });
});
