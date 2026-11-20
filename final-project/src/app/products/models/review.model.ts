export type ReviewRequest = {
  rating: number;
  comment?: string | null;
};

export type ReviewAuthor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export type Review = {
  id: string;
  productId: string;
  productName: string | null;
  rating: number;
  comment: string | null;
  author: ReviewAuthor;
  createdAt: string;
  updatedAt: string | null;
};

export type ReviewPagedResult = {
  items: Review[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type RatingDistribution = {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
};

export type ProductReviews = {
  reviews: ReviewPagedResult;
  averageRating: number;
  reviewCount: number;
  distribution: RatingDistribution;
};

export type ReviewQueryParams = {
  page?: number;
  pageSize?: number;
  rating?: number;
};
