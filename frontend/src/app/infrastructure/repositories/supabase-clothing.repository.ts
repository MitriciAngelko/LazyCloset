import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';

import { ClothingRepository, ClothingStats } from '../../core/repositories/clothing-repository.interface';
import { 
  ClothingItemEntity, 
  ClothingItemId, 
  CreateClothingItemData, 
  UpdateClothingItemData,
  ClothingCategory,
  ClothingColor,
  ClothingSize
} from '../../shared/models/domain/clothing.model';
import { 
  Result, 
  ResultUtils, 
  ErrorCodes,
  PaginatedResult, 
  QueryParams,
  PaginationUtils
} from '../../shared/models';
import { 
  SupabaseDatabase, 
  SupabaseClothingItemRow,
  SupabaseClothingItemInsert,
  SupabaseClothingItemUpdate
} from '../../shared/models/infrastructure/supabase.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseClothingRepository implements ClothingRepository {

  constructor(private supabaseClient: SupabaseClient<SupabaseDatabase>) {}

  findAll(params?: QueryParams): Observable<Result<PaginatedResult<ClothingItemEntity>>> {
    return from(this.executeQuery(params)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch clothing items',
        error
      )))
    );
  }

  findById(id: ClothingItemId): Observable<Result<ClothingItemEntity>> {
    return from(this.executeFindById(id)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch clothing item',
        error
      )))
    );
  }

  findByUserId(userId: string, params?: QueryParams): Observable<Result<PaginatedResult<ClothingItemEntity>>> {
    const userParams = { ...params, userId };
    return this.findAll(userParams);
  }

  create(userId: string, data: CreateClothingItemData): Observable<Result<ClothingItemEntity>> {
    return from(this.executeCreate(userId, data)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to create clothing item',
        error
      )))
    );
  }

  update(id: ClothingItemId, data: UpdateClothingItemData): Observable<Result<ClothingItemEntity>> {
    return from(this.executeUpdate(id, data)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to update clothing item',
        error
      )))
    );
  }

  delete(id: ClothingItemId): Observable<Result<void>> {
    return from(this.executeDelete(id)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to delete clothing item',
        error
      )))
    );
  }

  toggleFavorite(id: ClothingItemId): Observable<Result<ClothingItemEntity>> {
    return from(this.executeToggleFavorite(id)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to toggle favorite status',
        error
      )))
    );
  }

  getStats(userId: string): Observable<Result<ClothingStats>> {
    return from(this.executeGetStats(userId)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch statistics',
        error
      )))
    );
  }

  deleteMany(ids: ClothingItemId[]): Observable<Result<void>> {
    return from(this.executeDeleteMany(ids)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to delete items',
        error
      )))
    );
  }

  updateMany(updates: { id: ClothingItemId; data: UpdateClothingItemData }[]): Observable<Result<ClothingItemEntity[]>> {
    return from(this.executeUpdateMany(updates)).pipe(
      catchError(error => of(ResultUtils.failureFromError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to update items',
        error
      )))
    );
  }

  // Private implementation methods
  private async executeQuery(params?: QueryParams): Promise<Result<PaginatedResult<ClothingItemEntity>>> {
    try {
      let query = this.supabaseClient
        .from('clothing_items')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params?.category) {
        query = query.eq('category', params.category);
      }

      if (params?.colors && params.colors.length > 0) {
        query = query.overlaps('colors', params.colors);
      }

      if (params?.tags && params.tags.length > 0) {
        query = query.overlaps('tags', params.tags);
      }

      if (params?.isFavorite !== undefined) {
        query = query.eq('is_favorite', params.isFavorite);
      }

      if (params?.searchTerm) {
        query = query.or(`tags.cs.{${params.searchTerm}},brand.ilike.%${params.searchTerm}%`);
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'created_at';
      const sortOrder = params?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = PaginationUtils.calculateOffset(page, limit);
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      const items = (data || []).map(row => this.mapRowToEntity(row));
      const pagination = PaginationUtils.createInfo(page, count || 0, limit);

      return ResultUtils.success({
        items,
        pagination
      });

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during query execution',
        error
      );
    }
  }

  private async executeFindById(id: ClothingItemId): Promise<Result<ClothingItemEntity>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('clothing_items')
        .select('*')
        .eq('id', id.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return ResultUtils.failureFromError(
            ErrorCodes.ITEM_NOT_FOUND,
            'Clothing item not found'
          );
        }
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      const entity = this.mapRowToEntity(data);
      return ResultUtils.success(entity);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during item fetch',
        error
      );
    }
  }

  private async executeCreate(userId: string, data: CreateClothingItemData): Promise<Result<ClothingItemEntity>> {
    try {
      const insertData: SupabaseClothingItemInsert = {
        user_id: userId,
        category: data.category,
        image_url: data.imageUrl,
        thumbnail_url: data.thumbnailUrl,
        original_filename: data.originalFileName,
        colors: [...data.colors],
        tags: [...data.tags],
        size: data.size,
        brand: data.brand,
        is_favorite: data.isFavorite || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedData, error } = await this.supabaseClient
        .from('clothing_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      const entity = this.mapRowToEntity(insertedData);
      return ResultUtils.success(entity);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during item creation',
        error
      );
    }
  }

  private async executeUpdate(id: ClothingItemId, data: UpdateClothingItemData): Promise<Result<ClothingItemEntity>> {
    try {
      const updateData: SupabaseClothingItemUpdate = {
        updated_at: new Date().toISOString()
      };

      if (data.category) updateData.category = data.category;
      if (data.colors) updateData.colors = [...data.colors];
      if (data.tags) updateData.tags = [...data.tags];
      if (data.size !== undefined) updateData.size = data.size;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.isFavorite !== undefined) updateData.is_favorite = data.isFavorite;

      const { data: updatedData, error } = await this.supabaseClient
        .from('clothing_items')
        .update(updateData)
        .eq('id', id.value)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return ResultUtils.failureFromError(
            ErrorCodes.ITEM_NOT_FOUND,
            'Clothing item not found'
          );
        }
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      const entity = this.mapRowToEntity(updatedData);
      return ResultUtils.success(entity);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during item update',
        error
      );
    }
  }

  private async executeDelete(id: ClothingItemId): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient
        .from('clothing_items')
        .delete()
        .eq('id', id.value);

      if (error) {
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      return ResultUtils.success(undefined);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during item deletion',
        error
      );
    }
  }

  private async executeToggleFavorite(id: ClothingItemId): Promise<Result<ClothingItemEntity>> {
    try {
      // First get the current item
      const currentResult = await this.executeFindById(id);
      if (!ResultUtils.isSuccess(currentResult)) {
        return currentResult;
      }

      const currentItem = currentResult.data;
      const newFavoriteStatus = !currentItem.isFavorite;

      return this.executeUpdate(id, { isFavorite: newFavoriteStatus });

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during favorite toggle',
        error
      );
    }
  }

  private async executeGetStats(userId: string): Promise<Result<ClothingStats>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('clothing_items')
        .select('category, colors, tags, brand, size, is_favorite')
        .eq('user_id', userId);

      if (error) {
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      const stats = this.calculateStats(data || []);
      return ResultUtils.success(stats);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during stats calculation',
        error
      );
    }
  }

  private async executeDeleteMany(ids: ClothingItemId[]): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient
        .from('clothing_items')
        .delete()
        .in('id', ids.map(id => id.value));

      if (error) {
        return ResultUtils.failureFromError(
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error
        );
      }

      return ResultUtils.success(undefined);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during bulk deletion',
        error
      );
    }
  }

  private async executeUpdateMany(updates: { id: ClothingItemId; data: UpdateClothingItemData }[]): Promise<Result<ClothingItemEntity[]>> {
    try {
      const results: ClothingItemEntity[] = [];

      // Execute updates sequentially to maintain consistency
      for (const update of updates) {
        const result = await this.executeUpdate(update.id, update.data);
        if (ResultUtils.isSuccess(result)) {
          results.push(result.data);
        } else {
          return result;
        }
      }

      return ResultUtils.success(results);

    } catch (error) {
      return ResultUtils.failureFromError(
        ErrorCodes.UNKNOWN_ERROR,
        'Unexpected error during bulk update',
        error
      );
    }
  }

  private mapRowToEntity(row: SupabaseClothingItemRow): ClothingItemEntity {
    return new ClothingItemEntity({
      id: { value: row.id },
      userId: row.user_id || 'anonymous',
      category: row.category as ClothingCategory,
      imageUrl: row.image_url || '',
      thumbnailUrl: row.thumbnail_url || '',
      originalFileName: row.original_filename || '',
      colors: (row.colors || []) as ClothingColor[],
      tags: row.tags || [],
      size: row.size as ClothingSize | undefined,
      brand: row.brand || undefined,
      isFavorite: row.is_favorite,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  private calculateStats(items: any[]): ClothingStats {
    const stats: ClothingStats = {
      totalItems: items.length,
      favoriteItems: items.filter(item => item.is_favorite).length,
      categoryCounts: {},
      colorCounts: {},
      tagCounts: {},
      brandCounts: {},
      sizeCounts: {}
    };

    items.forEach(item => {
      // Count categories
      const category = item.category;
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;

      // Count colors
      (item.colors || []).forEach((color: string) => {
        stats.colorCounts[color] = (stats.colorCounts[color] || 0) + 1;
      });

      // Count tags
      (item.tags || []).forEach((tag: string) => {
        stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1;
      });

      // Count brands
      if (item.brand) {
        stats.brandCounts[item.brand] = (stats.brandCounts[item.brand] || 0) + 1;
      }

      // Count sizes
      if (item.size) {
        stats.sizeCounts[item.size] = (stats.sizeCounts[item.size] || 0) + 1;
      }
    });

    return stats;
  }
} 