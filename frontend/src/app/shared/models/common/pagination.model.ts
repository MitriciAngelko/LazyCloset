export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly pagination: PaginationInfo;
}

export interface PaginationInfo {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface FilterParams {
  readonly searchTerm?: string;
  readonly category?: string;
  readonly colors?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly isFavorite?: boolean;
}

export interface QueryParams extends PaginationParams, FilterParams {}

export class PaginationUtils {
  static createParams(
    page: number = 1,
    limit: number = 20,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): PaginationParams {
    return {
      page: Math.max(1, page),
      limit: Math.max(1, Math.min(100, limit)), // Max 100 items per page
      sortBy,
      sortOrder
    };
  }

  static createInfo(
    currentPage: number,
    totalItems: number,
    itemsPerPage: number
  ): PaginationInfo {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static validateParams(params: PaginationParams): boolean {
    return (
      params.page >= 1 &&
      params.limit >= 1 &&
      params.limit <= 100 &&
      (!params.sortOrder || ['asc', 'desc'].includes(params.sortOrder))
    );
  }
} 