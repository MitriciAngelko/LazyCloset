import { ClothingCategory, ClothingColor, ClothingSize } from '../domain/clothing.model';

// Request DTOs
export interface CreateClothingItemRequest {
  readonly category: ClothingCategory;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly originalFileName: string;
  readonly colors: ReadonlyArray<ClothingColor>;
  readonly tags: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite?: boolean;
}

export interface UpdateClothingItemRequest {
  readonly category?: ClothingCategory;
  readonly colors?: ReadonlyArray<ClothingColor>;
  readonly tags?: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite?: boolean;
}

export interface ClothingItemQueryRequest {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly category?: ClothingCategory;
  readonly colors?: ReadonlyArray<ClothingColor>;
  readonly tags?: ReadonlyArray<string>;
  readonly isFavorite?: boolean;
  readonly searchTerm?: string;
  readonly brand?: string;
  readonly size?: ClothingSize;
}

// Response DTOs
export interface ClothingItemResponse {
  readonly id: string;
  readonly userId: string;
  readonly category: ClothingCategory;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly originalFileName: string;
  readonly colors: ReadonlyArray<ClothingColor>;
  readonly tags: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClothingItemListResponse {
  readonly items: ReadonlyArray<ClothingItemResponse>;
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalItems: number;
    readonly itemsPerPage: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}

export interface ClothingStatsResponse {
  readonly totalItems: number;
  readonly favoriteItems: number;
  readonly categoryCounts: Record<ClothingCategory, number>;
  readonly colorCounts: Record<ClothingColor, number>;
  readonly tagCounts: Record<string, number>;
  readonly brandCounts: Record<string, number>;
  readonly sizeCounts: Record<ClothingSize, number>;
}

// Upload DTOs
export interface ImageUploadRequest {
  readonly file: File;
  readonly fileName?: string;
  readonly quality?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly generateThumbnail?: boolean;
  readonly thumbnailSize?: number;
}

export interface ImageUploadResponse {
  readonly success: boolean;
  readonly originalUrl?: string;
  readonly thumbnailUrl?: string;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly error?: string;
}

// Validation DTOs
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

export interface FieldValidationResult {
  readonly field: string;
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
}

// Utility classes for DTOs
export class ClothingDTOValidator {
  static validateCreateRequest(request: CreateClothingItemRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.category) {
      errors.push('Category is required');
    }

    if (!request.imageUrl) {
      errors.push('Image URL is required');
    }

    if (!request.thumbnailUrl) {
      errors.push('Thumbnail URL is required');
    }

    if (!request.originalFileName) {
      errors.push('Original file name is required');
    }

    if (!request.colors || request.colors.length === 0) {
      warnings.push('No colors specified');
    }

    // Validate enum values
    if (request.category && !Object.values(ClothingCategory).includes(request.category)) {
      errors.push('Invalid category');
    }

    if (request.colors) {
      const invalidColors = request.colors.filter(color => 
        !Object.values(ClothingColor).includes(color)
      );
      if (invalidColors.length > 0) {
        errors.push(`Invalid colors: ${invalidColors.join(', ')}`);
      }
    }

    if (request.size && !Object.values(ClothingSize).includes(request.size)) {
      errors.push('Invalid size');
    }

    // Validate strings
    if (request.originalFileName && request.originalFileName.length > 255) {
      errors.push('File name too long (max 255 characters)');
    }

    if (request.brand && request.brand.length > 100) {
      errors.push('Brand name too long (max 100 characters)');
    }

    if (request.tags) {
      const longTags = request.tags.filter(tag => tag.length > 50);
      if (longTags.length > 0) {
        errors.push('Some tags are too long (max 50 characters each)');
      }

      if (request.tags.length > 20) {
        errors.push('Too many tags (max 20)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateUpdateRequest(request: UpdateClothingItemRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate enum values if provided
    if (request.category && !Object.values(ClothingCategory).includes(request.category)) {
      errors.push('Invalid category');
    }

    if (request.colors) {
      const invalidColors = request.colors.filter(color => 
        !Object.values(ClothingColor).includes(color)
      );
      if (invalidColors.length > 0) {
        errors.push(`Invalid colors: ${invalidColors.join(', ')}`);
      }
    }

    if (request.size && !Object.values(ClothingSize).includes(request.size)) {
      errors.push('Invalid size');
    }

    // Validate strings if provided
    if (request.brand && request.brand.length > 100) {
      errors.push('Brand name too long (max 100 characters)');
    }

    if (request.tags) {
      const longTags = request.tags.filter(tag => tag.length > 50);
      if (longTags.length > 0) {
        errors.push('Some tags are too long (max 50 characters each)');
      }

      if (request.tags.length > 20) {
        errors.push('Too many tags (max 20)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateQueryRequest(request: ClothingItemQueryRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate pagination
    if (request.page !== undefined && request.page < 1) {
      errors.push('Page must be greater than 0');
    }

    if (request.limit !== undefined && (request.limit < 1 || request.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    if (request.sortOrder && !['asc', 'desc'].includes(request.sortOrder)) {
      errors.push('Sort order must be "asc" or "desc"');
    }

    // Validate enum values if provided
    if (request.category && !Object.values(ClothingCategory).includes(request.category)) {
      errors.push('Invalid category');
    }

    if (request.colors) {
      const invalidColors = request.colors.filter(color => 
        !Object.values(ClothingColor).includes(color)
      );
      if (invalidColors.length > 0) {
        errors.push(`Invalid colors: ${invalidColors.join(', ')}`);
      }
    }

    if (request.size && !Object.values(ClothingSize).includes(request.size)) {
      errors.push('Invalid size');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
} 