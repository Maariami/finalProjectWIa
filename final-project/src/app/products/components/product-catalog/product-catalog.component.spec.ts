import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, of, take } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PagedResult,
  ProductDetails,
  ProductFilters,
  ProductListItem,
} from '../../models/product.model';
import { ProductsService } from '../../services/products.service';
import { ProductCatalogComponent } from './product-catalog.component';
import { ProductDetailsComponent } from '../product-details/product-details.component';

const firstProduct = {
  id: 'b452e26a-58a8-47d3-bf73-2c310a52c9a9',
  name: 'First product',
  slug: 'first-product',
  brand: 'Brand',
  sku: 'SKU-1',
  price: 10,
  oldPrice: null,
  stock: 1,
  isActive: true,
  primaryImageUrl: null,
  averageRating: 0,
  reviewCount: 0,
  viewCount: 0,
  category: { id: 'category-id', name: 'Category', slug: 'category' },
  isFavorite: false,
  createdAt: '2026-01-01T00:00:00Z',
  inStock: true,
  discountPercent: null,
} satisfies ProductListItem;

const secondProduct = {
  ...firstProduct,
  id: '2a462f83-4958-44c3-9ca8-5bdabffccca5',
  name: 'Second product',
  slug: 'second-product',
  sku: 'SKU-2',
} satisfies ProductListItem;

const productsService = {
  getProducts: vi.fn<ProductsService['getProducts']>(),
  getProductFilters: vi.fn<ProductsService['getProductFilters']>(),
  getProductByIdOrSlug: vi.fn<ProductsService['getProductByIdOrSlug']>(),
};

const createDetails = (product: ProductListItem): ProductDetails => ({
  id: product.id,
  name: `${product.name} details`,
  slug: product.slug,
  description: '',
  sku: product.sku,
  brand: product.brand,
  price: product.price,
  oldPrice: product.oldPrice,
  stock: product.stock,
  isActive: product.isActive,
  viewCount: product.viewCount,
  averageRating: product.averageRating,
  reviewCount: product.reviewCount,
  category: product.category,
  images: [],
  isFavorite: product.isFavorite,
  createdAt: product.createdAt,
  updatedAt: null,
  inStock: product.inStock,
  discountPercent: product.discountPercent,
});

describe('ProductCatalogComponent navigation', () => {
  beforeEach(() => {
    productsService.getProducts.mockReset().mockReturnValue(
      of({
        items: [firstProduct, secondProduct],
        page: 1,
        pageSize: 12,
        totalCount: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      } satisfies PagedResult<ProductListItem>),
    );
    productsService.getProductFilters.mockReset().mockReturnValue(
      of({
        categories: [],
        brands: [],
        minPrice: null,
        maxPrice: null,
      } satisfies ProductFilters),
    );
    productsService.getProductByIdOrSlug
      .mockReset()
      .mockImplementation((idOrSlug) =>
        of(createDetails(idOrSlug === 'first-product' ? firstProduct : secondProduct)),
      );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'products/:idOrSlug',
            component: ProductDetailsComponent,
          },
          {
            path: 'products',
            component: ProductCatalogComponent,
          },
        ]),
        { provide: ProductsService, useValue: productsService },
      ],
    });
  });

  it('navigates each product card to its matching details route', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products', ProductCatalogComponent);
    const cards = harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('.product-card');

    expect(cards).toHaveLength(2);
    expect(cards?.[0].getAttribute('href')).toBe('/products/first-product');
    expect(cards?.[1].getAttribute('href')).toBe('/products/second-product');

    const router = TestBed.inject(Router);
    const firstNavigation = firstValueFrom(
      router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
      ),
    );
    cards?.[0].click();
    await firstNavigation;
    harness.detectChanges();
    expect(router.url).toBe('/products/first-product');
    expect(harness.routeNativeElement?.textContent).toContain('First product details');

    await harness.navigateByUrl('/products', ProductCatalogComponent);

    const secondCard =
      harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('.product-card')[1];
    const secondNavigation = firstValueFrom(
      router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
      ),
    );
    secondCard?.click();
    await secondNavigation;
    harness.detectChanges();
    expect(router.url).toBe('/products/second-product');
    expect(harness.routeNativeElement?.textContent).toContain('Second product details');
  });
});
