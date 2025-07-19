import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { 
  ClothingItem, 
  ClothingCategory, 
  ClothingColor, 
  UploadResult 
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ClothingService {
  private readonly STORAGE_KEY = 'lazy-closet-items';
  private clothingItemsSubject = new BehaviorSubject<ClothingItem[]>([]);
  public clothingItems$ = this.clothingItemsSubject.asObservable();

  constructor() {
    this.loadItemsFromStorage();
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
    return from(this.processImageUpload(file, category, colors, tags)).pipe(
      catchError(error => {
        console.error('Upload failed:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  /**
   * Delete a clothing item
   */
  deleteClothingItem(itemId: string): Observable<boolean> {
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
   * Process image upload with compression and thumbnail generation
   */
  private async processImageUpload(
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

      // Create clothing item
      const newItem: ClothingItem = {
        id: uuidv4(),
        userId: 'local-user', // For now, using local user
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

      return { success: true, item: newItem };
    } catch (error) {
      throw new Error(`Failed to process image: ${error}`);
    }
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
   * Load items from localStorage
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
   * Save items to localStorage
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
} 