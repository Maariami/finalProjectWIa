export type AdminDashboardProduct = {
  id: string;
  name: string;
  slug: string;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  stock: number;
};

export type AdminCategoryStat = {
  id: string;
  name: string;
  productCount: number;
};

export type AdminDashboard = {
  totalUsers: number;
  totalAdmins: number;
  blockedUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  activeBanners: number;
  totalReviews: number;
  totalViews: number;
  topViewedProducts: AdminDashboardProduct[];
  topRatedProducts: AdminDashboardProduct[];
  lowStockProducts: AdminDashboardProduct[];
  productsPerCategory: AdminCategoryStat[];
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  createdAt: string;
};

export type AdminCategoryRequest = {
  name: string;
  description?: string | null;
};

export type AdminProductRequest = {
  name: string;
  description: string;
  sku: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  categoryId: string;
  isActive: boolean;
};

export type AdminProductsQuery = {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
  categoryId?: string;
};
