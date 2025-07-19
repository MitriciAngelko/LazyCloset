import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, EMPTY } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { 
  ClothingItem, 
  ClothingCategory, 
  ClothingColor, 
  UploadResult 
} from '../../shared/models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ClothingService {
  private readonly STORAGE_KEY = 'lazy-closet-items';
  private clothingItemsSubject = new BehaviorSubject<ClothingItem[]>([]);
  public clothingItems$ = this.clothingItemsSubject.asObservable();

  private isOnline = true;
  private hasMigratedToSupabase = false;

  constructor(private supabaseService: SupabaseService) {
    this.initializeService();
  }

  /**
   * Initialize the service and load data
   */
  private async initializeService(): Promise<void> {
    try {
      // Initialize Supabase storage
      await this.supabaseService.initializeStorage();
      
      // Wait a bit for Supabase to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to load from Supabase first
      await this.loadItemsFromSupabase();
      
      // If no data in Supabase, check for localStorage data to migrate
      const currentItems = this.clothingItemsSubject.value;
      if (currentItems.length === 0) {
        await this.checkAndMigrateFromLocalStorage();
      }
      
      this.isOnline = true;
      console.log('✅ Supabase integration active');
    } catch (error) {
      console.warn('⚠️ Supabase not available, falling back to localStorage:', error);
      this.isOnline = false;
      this.loadItemsFromStorage();
    }
  }

  /**
   * Load items from Supabase
   */
  private async loadItemsFromSupabase(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.db
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const items: ClothingItem[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id || 'anonymous',
        category: item.category as ClothingCategory,
        imageUrl: item.image_url || '',
        thumbnailUrl: item.thumbnail_url || '',
        originalFileName: item.original_filename || '',
        colors: (item.colors || []) as ClothingColor[],
        tags: item.tags || [],
        isFavorite: item.is_favorite,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      this.clothingItemsSubject.next(items);
    } catch (error) {
      console.error('Failed to load items from Supabase:', error);
      throw error;
    }
  }

  /**
   * Check for localStorage data and migrate to Supabase
   */
  private async checkAndMigrateFromLocalStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && !this.hasMigratedToSupabase) {
        const localItems: ClothingItem[] = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));

        if (localItems.length > 0) {
          console.log(`Migrating ${localItems.length} items from localStorage to Supabase...`);
          
          for (const item of localItems) {
            await this.migrateItemToSupabase(item);
          }

          // Reload from Supabase after migration
          await this.loadItemsFromSupabase();
          
          // Clear localStorage after successful migration
          localStorage.removeItem(this.STORAGE_KEY);
          this.hasMigratedToSupabase = true;
          
          console.log('Migration completed successfully!');
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  /**
   * Migrate a single item to Supabase
   */
  private async migrateItemToSupabase(item: ClothingItem): Promise<void> {
    try {
      const { error } = await this.supabaseService.db.insert({
        id: item.id,
        user_id: null, // Anonymous for now
        category: item.category,
        image_url: item.imageUrl,
        thumbnail_url: item.thumbnailUrl,
        original_filename: item.originalFileName,
        colors: item.colors,
        tags: item.tags,
        is_favorite: item.isFavorite,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString()
      });

      if (error) {
        console.error('Failed to migrate item:', item.id, error);
      }
    } catch (error) {
      console.error('Error migrating item:', error);
    }
  }

  /**
   * Get all clothing items
   */
  getClothingItems(): Observable<ClothingItem[]> {
    return this.clothingItems$;
  }

  /**
   * Get items by category
   */
  getItemsByCategory(category: ClothingCategory): Observable<ClothingItem[]> {
    return this.clothingItems$.pipe(
      map(items => items.filter(item => item.category === category))
    );
  }

  /**
   * Upload and process a new clothing item
   */
  uploadClothingItem(
    file: File, 
    category: ClothingCategory, 
    colors: ClothingColor[] = [],
    tags: string[] = []
  ): Observable<UploadResult> {
    if (this.isOnline) {
      return from(this.processImageUploadToSupabase(file, category, colors, tags)).pipe(
        catchError(error => {
          console.error('Upload failed:', error);
          return of({ success: false, error: error.message });
        })
      );
    } else {
      return from(this.processImageUploadLocal(file, category, colors, tags)).pipe(
        catchError(error => {
          console.error('Upload failed:', error);
          return of({ success: false, error: error.message });
        })
      );
    }
  }

  /**
   * Process image upload to Supabase
   */
  private async processImageUploadToSupabase(
    file: File, 
    category: ClothingCategory, 
    colors: ClothingColor[],
    tags: string[]
  ): Promise<UploadResult> {
    try {
      const itemId = uuidv4();
      
      // Compress images
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
      });

      const thumbnailFile = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 300,
        useWebWorker: true,
        fileType: 'image/jpeg'
      });

      // Upload to Supabase Storage
      const imagePath = `${itemId}/image.jpg`;
      const thumbnailPath = `${itemId}/thumbnail.jpg`;

      const [imageUpload, thumbnailUpload] = await Promise.all([
        this.supabaseService.uploadImage(compressedFile, imagePath),
        this.supabaseService.uploadImage(thumbnailFile, thumbnailPath)
      ]);

      if (imageUpload.error || thumbnailUpload.error) {
        console.warn('⚠️ Supabase storage failed, falling back to base64 storage');
        console.error('Storage errors:', { imageUpload: imageUpload.error, thumbnailUpload: thumbnailUpload.error });
        
        // Fallback to base64 storage
        return this.processImageUploadLocal(file, category, colors, tags);
      }

      // Create database record
      const newItem = {
        id: itemId,
        user_id: null, // Anonymous for now
        category,
        image_url: imageUpload.url,
        thumbnail_url: thumbnailUpload.url,
        original_filename: file.name,
        colors,
        tags,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.db
        .insert(newItem)
        .select()
        .single();

      if (error) {
        // Clean up uploaded images if database insert fails
        await Promise.all([
          this.supabaseService.deleteImage(imagePath),
          this.supabaseService.deleteImage(thumbnailPath)
        ]);
        throw error;
      }

      // Reload data from Supabase
      await this.loadItemsFromSupabase();

      const clothingItem: ClothingItem = {
        id: data.id,
        userId: data.user_id || 'anonymous',
        category: data.category as ClothingCategory,
        imageUrl: data.image_url || '',
        thumbnailUrl: data.thumbnail_url || '',
        originalFileName: data.original_filename || '',
        colors: data.colors as ClothingColor[] || [],
        tags: data.tags || [],
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, item: clothingItem };
    } catch (error: any) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Process image upload locally (fallback)
   */
  private async processImageUploadLocal(
    file: File, 
    category: ClothingCategory, 
    colors: ClothingColor[],
    tags: string[]
  ): Promise<UploadResult> {
    try {
      // Compress the main image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
      });

      // Create thumbnail
      const thumbnailFile = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 300,
        useWebWorker: true,
        fileType: 'image/jpeg'
      });

      // Convert to base64 for local storage
      const [imageUrl, thumbnailUrl] = await Promise.all([
        this.fileToBase64(compressedFile),
        this.fileToBase64(thumbnailFile)
      ]);

      // If online, try to save to Supabase database with base64 images
      if (this.isOnline) {
        try {
          const itemId = uuidv4();
          const newItem = {
            id: itemId,
            user_id: null,
            category,
            image_url: imageUrl,
            thumbnail_url: thumbnailUrl,
            original_filename: file.name,
            colors,
            tags,
            is_favorite: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data, error } = await this.supabaseService.db
            .insert(newItem)
            .select()
            .single();

          if (!error && data) {
            // Reload data from Supabase
            await this.loadItemsFromSupabase();

            const clothingItem: ClothingItem = {
              id: data.id,
              userId: data.user_id || 'anonymous',
              category: data.category as ClothingCategory,
              imageUrl: data.image_url || '',
              thumbnailUrl: data.thumbnail_url || '',
              originalFileName: data.original_filename || '',
              colors: data.colors as ClothingColor[] || [],
              tags: data.tags || [],
              isFavorite: data.is_favorite,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at)
            };

            console.log('✅ Item saved to Supabase DB with base64 images');
            return { success: true, item: clothingItem };
          }
        } catch (dbError) {
          console.warn('⚠️ Database save failed, using localStorage only');
        }
      }

      // Fallback to pure localStorage
      const newItem: ClothingItem = {
        id: uuidv4(),
        userId: 'local-user',
        category,
        imageUrl,
        thumbnailUrl,
        originalFileName: file.name,
        colors,
        tags,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to collection
      const currentItems = this.clothingItemsSubject.value;
      const updatedItems = [...currentItems, newItem];
      
      this.clothingItemsSubject.next(updatedItems);
      this.saveItemsToStorage(updatedItems);

      console.log('✅ Item saved to localStorage only');
      return { success: true, item: newItem };
    } catch (error: any) {
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  /**
   * Delete a clothing item
   */
  deleteClothingItem(itemId: string): Observable<boolean> {
    if (this.isOnline) {
      return from(this.deleteItemFromSupabase(itemId));
    } else {
      return this.deleteItemLocally(itemId);
    }
  }

  /**
   * Delete item from Supabase
   */
  private async deleteItemFromSupabase(itemId: string): Promise<boolean> {
    try {
      // Get item details for image cleanup
      const item = this.clothingItemsSubject.value.find(i => i.id === itemId);
      
      // Delete from database
      const { error } = await this.supabaseService.db
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      // Delete images from storage (if they exist and are not base64)
      if (item && item.imageUrl && !item.imageUrl.startsWith('data:')) {
        const imagePath = `${itemId}/image.jpg`;
        const thumbnailPath = `${itemId}/thumbnail.jpg`;
        
        await Promise.all([
          this.supabaseService.deleteImage(imagePath),
          this.supabaseService.deleteImage(thumbnailPath)
        ]);
      }

      // Reload data
      await this.loadItemsFromSupabase();
      
      return true;
    } catch (error) {
      console.error('Failed to delete item from Supabase:', error);
      return false;
    }
  }

  /**
   * Delete item locally
   */
  private deleteItemLocally(itemId: string): Observable<boolean> {
    const currentItems = this.clothingItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    
    this.clothingItemsSubject.next(updatedItems);
    this.saveItemsToStorage(updatedItems);
    
    return of(true);
  }

  /**
   * Update clothing item
   */
  updateClothingItem(updatedItem: Partial<ClothingItem> & { id: string }): Observable<ClothingItem | null> {
    if (this.isOnline) {
      return from(this.updateItemInSupabase(updatedItem));
    } else {
      return this.updateItemLocally(updatedItem);
    }
  }

  /**
   * Update item in Supabase
   */
  private async updateItemInSupabase(updatedItem: Partial<ClothingItem> & { id: string }): Promise<ClothingItem | null> {
    try {
      const updateData = {
        category: updatedItem.category,
        colors: updatedItem.colors,
        tags: updatedItem.tags,
        is_favorite: updatedItem.isFavorite,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.db
        .update(updateData)
        .eq('id', updatedItem.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload data
      await this.loadItemsFromSupabase();

      const clothingItem: ClothingItem = {
        id: data.id,
        userId: data.user_id || 'anonymous',
        category: data.category as ClothingCategory,
        imageUrl: data.image_url || '',
        thumbnailUrl: data.thumbnail_url || '',
        originalFileName: data.original_filename || '',
        colors: data.colors as ClothingColor[] || [],
        tags: data.tags || [],
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return clothingItem;
    } catch (error) {
      console.error('Failed to update item in Supabase:', error);
      return null;
    }
  }

  /**
   * Update item locally
   */
  private updateItemLocally(updatedItem: Partial<ClothingItem> & { id: string }): Observable<ClothingItem | null> {
    const currentItems = this.clothingItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.id === updatedItem.id);
    
    if (itemIndex === -1) {
      return of(null);
    }

    const updated = {
      ...currentItems[itemIndex],
      ...updatedItem,
      updatedAt: new Date()
    };

    const updatedItems = [...currentItems];
    updatedItems[itemIndex] = updated;
    
    this.clothingItemsSubject.next(updatedItems);
    this.saveItemsToStorage(updatedItems);
    
    return of(updated);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(itemId: string): Observable<ClothingItem | null> {
    const currentItems = this.clothingItemsSubject.value;
    const item = currentItems.find(item => item.id === itemId);
    
    if (!item) {
      return of(null);
    }

    return this.updateClothingItem({ 
      id: itemId, 
      isFavorite: !item.isFavorite 
    });
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load items from localStorage (fallback)
   */
  private loadItemsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items: ClothingItem[] = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
        this.clothingItemsSubject.next(items);
      }
    } catch (error) {
      console.error('Failed to load items from storage:', error);
    }
  }

  /**
   * Save items to localStorage (fallback)
   */
  private saveItemsToStorage(items: ClothingItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save items to storage:', error);
    }
  }

  /**
   * Clear all items (for development/testing)
   */
  clearAllItems(): void {
    this.clothingItemsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get connection status
   */
  isConnectedToSupabase(): boolean {
    return this.isOnline;
  }

  /**
   * Force sync with Supabase
   */
  async syncWithSupabase(): Promise<void> {
    try {
      await this.loadItemsFromSupabase();
      this.isOnline = true;
    } catch (error) {
      console.error('Failed to sync with Supabase:', error);
      this.isOnline = false;
    }
  }
} 