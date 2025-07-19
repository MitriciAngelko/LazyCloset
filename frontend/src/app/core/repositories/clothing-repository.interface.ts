import { Observable } from 'rxjs';
import { 
  ClothingItemEntity, 
  ClothingItemId, 
  CreateClothingItemData, 
  UpdateClothingItemData 
} from '../../shared/models/domain/clothing.model';
import { 
  Result, 
  PaginatedResult, 
  QueryParams 
} from '../../shared/models';

export interface ClothingRepository {
  // Query operations
  findAll(params?: QueryParams): Observable<Result<PaginatedResult<ClothingItemEntity>>>;
  findById(id: ClothingItemId): Observable<Result<ClothingItemEntity>>;
  findByUserId(userId: string, params?: QueryParams): Observable<Result<PaginatedResult<ClothingItemEntity>>>;
  
  // CRUD operations
  create(userId: string, data: CreateClothingItemData): Observable<Result<ClothingItemEntity>>;
  update(id: ClothingItemId, data: UpdateClothingItemData): Observable<Result<ClothingItemEntity>>;
  delete(id: ClothingItemId): Observable<Result<void>>;
  
  // Business operations
  toggleFavorite(id: ClothingItemId): Observable<Result<ClothingItemEntity>>;
  
  // Statistics
  getStats(userId: string): Observable<Result<ClothingStats>>;
  
  // Batch operations
  deleteMany(ids: ClothingItemId[]): Observable<Result<void>>;
  updateMany(updates: { id: ClothingItemId; data: UpdateClothingItemData }[]): Observable<Result<ClothingItemEntity[]>>;
}

export interface ClothingStats {
  readonly totalItems: number;
  readonly favoriteItems: number;
  readonly categoryCounts: Record<string, number>;
  readonly colorCounts: Record<string, number>;
  readonly tagCounts: Record<string, number>;
  readonly brandCounts: Record<string, number>;
  readonly sizeCounts: Record<string, number>;
} 