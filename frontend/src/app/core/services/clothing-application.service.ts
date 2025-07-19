import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';

import { ClothingRepository } from '../repositories/clothing-repository.interface';
import { FileUploadRepository } from '../repositories/file-upload-repository.interface';
import { 
  ClothingItemEntity, 
  ClothingItemId, 
  CreateClothingItemData, 
  UpdateClothingItemData 
} from '../../shared/models/domain/clothing.model';
import { UploadFileEntity, ImageUploadOptions } from '../../shared/models/domain/upload.model';
import { 
  Result, 
  ResultUtils, 
  ErrorCodes,
  PaginatedResult, 
  QueryParams 
} from '../../shared/models';
import { 
  CreateClothingItemRequest,
  UpdateClothingItemRequest,
  ClothingItemQueryRequest,
  ClothingItemResponse,
  ClothingItemListResponse,
  ClothingStatsResponse,
  ImageUploadRequest,
  ClothingDTOValidator
} from '../../shared/models/dtos/clothing.dto';

@Injectable({
  providedIn: 'root'
})
export class ClothingApplicationService {
  private readonly currentUserId = 'anonymous'; // TODO: Get from auth service
  private clothingItemsSubject = new BehaviorSubject<ClothingItemEntity[]>([]);
  public clothingItems$ = this.clothingItemsSubject.asObservable();

  constructor(
    private clothingRepository: ClothingRepository,
    private fileUploadRepository: FileUploadRepository
  ) {
    this.loadInitialData();
  }

  /**
   * Get all clothing items with filtering and pagination
   */
  getClothingItems(request: ClothingItemQueryRequest): Observable<Result<ClothingItemListResponse>> {
    // Validate request
    const validation = ClothingDTOValidator.validateQueryRequest(request);
    if (!validation.valid) {
      return of(ResultUtils.failureFromError(
        ErrorCodes.VALIDATION_ERROR,
        validation.errors.join(', ')
      ));
    }

    const queryParams: QueryParams = {
      page: request.page,
      limit: request.limit,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
      category: request.category,
      colors: request.colors,
      tags: request.tags,
      isFavorite: request.isFavorite,
      searchTerm: request.searchTerm
    };

    return this.clothingRepository.findByUserId(this.currentUserId, queryParams).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const response: ClothingItemListResponse = {
            items: result.data.items.map(entity => this.mapEntityToResponse(entity)),
            pagination: result.data.pagination
          };
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Get a specific clothing item by ID
   */
  getClothingItem(id: string): Observable<Result<ClothingItemResponse>> {
    const clothingId: ClothingItemId = { value: id };
    
    return this.clothingRepository.findById(clothingId).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const response = this.mapEntityToResponse(result.data);
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Create a new clothing item with image upload
   */
  createClothingItem(request: CreateClothingItemRequest): Observable<Result<ClothingItemResponse>> {
    // Validate request
    const validation = ClothingDTOValidator.validateCreateRequest(request);
    if (!validation.valid) {
      return of(ResultUtils.failureFromError(
        ErrorCodes.VALIDATION_ERROR,
        validation.errors.join(', ')
      ));
    }

    const createData: CreateClothingItemData = {
      category: request.category,
      imageUrl: request.imageUrl,
      thumbnailUrl: request.thumbnailUrl,
      originalFileName: request.originalFileName,
      colors: request.colors,
      tags: request.tags,
      size: request.size,
      brand: request.brand,
      isFavorite: request.isFavorite
    };

    return this.clothingRepository.create(this.currentUserId, createData).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          // Update local state
          this.updateLocalItems();
          
          const response = this.mapEntityToResponse(result.data);
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Upload image and create clothing item in one operation
   */
  uploadAndCreateClothingItem(
    imageRequest: ImageUploadRequest, 
    clothingRequest: Omit<CreateClothingItemRequest, 'imageUrl' | 'thumbnailUrl' | 'originalFileName'>
  ): Observable<Result<ClothingItemResponse>> {
    
    // Validate file
    const fileValidation = this.fileUploadRepository.validateFile(imageRequest.file);
    if (!ResultUtils.isSuccess(fileValidation)) {
      return of(fileValidation);
    }

    const uploadFile = new UploadFileEntity(imageRequest.file);
    const uploadOptions: ImageUploadOptions = {
      quality: imageRequest.quality,
      maxWidth: imageRequest.maxWidth,
      maxHeight: imageRequest.maxHeight,
      thumbnailSize: imageRequest.thumbnailSize
    };

    return this.fileUploadRepository.uploadImage(uploadFile, uploadOptions).pipe(
      switchMap(uploadResult => {
        if (ResultUtils.isSuccess(uploadResult)) {
          const createRequest: CreateClothingItemRequest = {
            ...clothingRequest,
            imageUrl: uploadResult.data.originalUrl,
            thumbnailUrl: uploadResult.data.thumbnailUrl,
            originalFileName: uploadResult.data.fileName
          };
          
          return this.createClothingItem(createRequest);
        }
        return of(uploadResult);
      })
    );
  }

  /**
   * Update an existing clothing item
   */
  updateClothingItem(id: string, request: UpdateClothingItemRequest): Observable<Result<ClothingItemResponse>> {
    // Validate request
    const validation = ClothingDTOValidator.validateUpdateRequest(request);
    if (!validation.valid) {
      return of(ResultUtils.failureFromError(
        ErrorCodes.VALIDATION_ERROR,
        validation.errors.join(', ')
      ));
    }

    const clothingId: ClothingItemId = { value: id };
    const updateData: UpdateClothingItemData = {
      category: request.category,
      colors: request.colors,
      tags: request.tags,
      size: request.size,
      brand: request.brand,
      isFavorite: request.isFavorite
    };

    return this.clothingRepository.update(clothingId, updateData).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          // Update local state
          this.updateLocalItems();
          
          const response = this.mapEntityToResponse(result.data);
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Delete a clothing item
   */
  deleteClothingItem(id: string): Observable<Result<void>> {
    const clothingId: ClothingItemId = { value: id };
    
    return this.clothingRepository.delete(clothingId).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          // Update local state
          this.updateLocalItems();
        }
        return result;
      })
    );
  }

  /**
   * Toggle favorite status of a clothing item
   */
  toggleFavorite(id: string): Observable<Result<ClothingItemResponse>> {
    const clothingId: ClothingItemId = { value: id };
    
    return this.clothingRepository.toggleFavorite(clothingId).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          // Update local state
          this.updateLocalItems();
          
          const response = this.mapEntityToResponse(result.data);
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Get clothing statistics
   */
  getClothingStats(): Observable<Result<ClothingStatsResponse>> {
    return this.clothingRepository.getStats(this.currentUserId).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const response: ClothingStatsResponse = {
            totalItems: result.data.totalItems,
            favoriteItems: result.data.favoriteItems,
            categoryCounts: result.data.categoryCounts as any,
            colorCounts: result.data.colorCounts as any,
            tagCounts: result.data.tagCounts,
            brandCounts: result.data.brandCounts,
            sizeCounts: result.data.sizeCounts as any
          };
          return ResultUtils.success(response);
        }
        return result;
      })
    );
  }

  /**
   * Delete multiple clothing items
   */
  deleteMultipleItems(ids: string[]): Observable<Result<void>> {
    const clothingIds: ClothingItemId[] = ids.map(id => ({ value: id }));
    
    return this.clothingRepository.deleteMany(clothingIds).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          // Update local state
          this.updateLocalItems();
        }
        return result;
      })
    );
  }

  /**
   * Search clothing items
   */
  searchClothingItems(searchTerm: string, limit: number = 10): Observable<Result<ClothingItemResponse[]>> {
    const queryParams: QueryParams = {
      searchTerm,
      limit,
      page: 1
    };

    return this.clothingRepository.findByUserId(this.currentUserId, queryParams).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const items = result.data.items.map(entity => this.mapEntityToResponse(entity));
          return ResultUtils.success(items);
        }
        return result;
      })
    );
  }

  /**
   * Get recent clothing items
   */
  getRecentItems(limit: number = 5): Observable<Result<ClothingItemResponse[]>> {
    const queryParams: QueryParams = {
      limit,
      page: 1,
      sortBy: 'created_at',
      sortOrder: 'desc'
    };

    return this.clothingRepository.findByUserId(this.currentUserId, queryParams).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const items = result.data.items.map(entity => this.mapEntityToResponse(entity));
          return ResultUtils.success(items);
        }
        return result;
      })
    );
  }

  /**
   * Get favorite items
   */
  getFavoriteItems(): Observable<Result<ClothingItemResponse[]>> {
    const queryParams: QueryParams = {
      isFavorite: true,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    };

    return this.clothingRepository.findByUserId(this.currentUserId, queryParams).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          const items = result.data.items.map(entity => this.mapEntityToResponse(entity));
          return ResultUtils.success(items);
        }
        return result;
      })
    );
  }

  // Private helper methods
  private loadInitialData(): void {
    this.updateLocalItems();
  }

  private updateLocalItems(): void {
    const queryParams: QueryParams = {
      limit: 100, // Get recent items for local state
      page: 1,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    };

    this.clothingRepository.findByUserId(this.currentUserId, queryParams).pipe(
      map(result => {
        if (ResultUtils.isSuccess(result)) {
          this.clothingItemsSubject.next(result.data.items);
        }
      })
    ).subscribe();
  }

  private mapEntityToResponse(entity: ClothingItemEntity): ClothingItemResponse {
    return {
      id: entity.id.value,
      userId: entity.userId,
      category: entity.category,
      imageUrl: entity.imageUrl,
      thumbnailUrl: entity.thumbnailUrl,
      originalFileName: entity.originalFileName,
      colors: entity.colors,
      tags: entity.tags,
      size: entity.size,
      brand: entity.brand,
      isFavorite: entity.isFavorite,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }
} 