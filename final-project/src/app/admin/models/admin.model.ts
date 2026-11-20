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
