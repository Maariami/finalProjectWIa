import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductDetails } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { ProductDetailsComponent } from './product-details.component';

const productsService = {
  getProductByIdOrSlug: vi.fn<ProductsService['getProductByIdOrSlug']>(),
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
});
