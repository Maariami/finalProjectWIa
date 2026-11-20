import type { UserRole } from '../../auth/models/auth.model';

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

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isCurrentlyVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type AdminReviewQuery = {
  page?: number;
  pageSize?: number;
  productId?: string;
  userId?: string;
  rating?: number;
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailConfirmed: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  reviewCount: number;
  favoriteCount: number;
  cartItemCount: number;
};

export type AdminCreateUserRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export type AdminUserSort = 'Newest' | 'Oldest' | 'EmailAsc' | 'NameAsc' | 'LastLogin';

export type AdminUsersQuery = {
  search?: string;
  role?: UserRole;
  isBlocked?: boolean;
  emailConfirmed?: boolean;
  sort?: AdminUserSort;
  page?: number;
  pageSize?: number;
};
