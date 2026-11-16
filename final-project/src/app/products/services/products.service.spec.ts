import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProductDetails } from '../models/product.model';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('fetches product details by ID or slug', () => {
    const identifiers = [
      'b452e26a-58a8-47d3-bf73-2c310a52c9a9',
      'apple-iphone-15-pro-128gb',
    ];

    for (const idOrSlug of identifiers) {
      const product = {
        id: 'b452e26a-58a8-47d3-bf73-2c310a52c9a9',
        name: 'Apple iPhone 15 Pro',
        slug: 'apple-iphone-15-pro-128gb',
        description: 'A smartphone',
        sku: 'APL-IP15P-128',
        brand: 'Apple',
        price: 999.99,
        oldPrice: null,
        stock: 5,
        isActive: true,
        viewCount: 1,
        averageRating: 4.5,
        reviewCount: 10,
        category: { id: 'category-id', name: 'Phones', slug: 'phones' },
        images: [],
        isFavorite: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: null,
        inStock: true,
        discountPercent: null,
      } satisfies ProductDetails;
      let response: ProductDetails | undefined;

      service.getProductByIdOrSlug(idOrSlug).subscribe((result) => {
        response = result;
      });

      const request = httpTestingController.expectOne(
        `https://wtm-2026-final-production.up.railway.app/api/products/${idOrSlug}`,
      );
      expect(request.request.method).toBe('GET');
      request.flush(product);
      expect(response).toEqual(product);
    }
  });
});
