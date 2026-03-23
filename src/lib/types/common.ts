// ─── Paginated Response ───
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Common API Response ───
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}
