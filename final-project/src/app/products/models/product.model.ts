export type ProductSort =
  | 'Newest'
  | 'PriceAsc'
  | 'PriceDesc'
  | 'MostViewed'
  | 'TopRated'
  | 'NameAsc'
  | 'NameDesc';

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  primaryImageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  category: ProductCategorySummary;
  isFavorite: boolean;
  createdAt: string;
  inStock: boolean;
  discountPercent: number | null;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  category: ProductCategorySummary;
  images: ProductImage[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string | null;
  inStock: boolean;
  discountPercent: number | null;
}

export interface ProductCategoryFacet {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ProductBrandFacet {
  name: string;
  count: number;
}

export interface ProductFilters {
  categories: ProductCategoryFacet[];
  brands: ProductBrandFacet[];
  minPrice: number | null;
  maxPrice: number | null;
}
