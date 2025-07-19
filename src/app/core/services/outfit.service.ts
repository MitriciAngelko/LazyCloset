import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { 
  Outfit, 
  OutfitItems, 
  ClothingItem, 
  ClothingCategory,
  OutfitGenerationOptions 
} from '../../shared/models';
import { ClothingService } from './clothing.service';

@Injectable({
  providedIn: 'root'
})
export class OutfitService {
  private readonly STORAGE_KEY = 'lazy-closet-outfits';
  private outfitsSubject = new BehaviorSubject<Outfit[]>([]);
  public outfits$ = this.outfitsSubject.asObservable();

  private currentOutfitSubject = new BehaviorSubject<Outfit | null>(null);
  public currentOutfit$ = this.currentOutfitSubject.asObservable();

  constructor(private clothingService: ClothingService) {
    this.loadOutfitsFromStorage();
  }

  /**
   * Generate a random outfit based on available clothing items
   */
  generateRandomOutfit(options: OutfitGenerationOptions = { 
    includeJacket: false, 
    includeHat: false 
  }): Observable<Outfit | null> {
    return combineLatest([
      this.clothingService.getItemsByCategory(ClothingCategory.SHIRT),
      this.clothingService.getItemsByCategory(ClothingCategory.PANTS),
      this.clothingService.getItemsByCategory(ClothingCategory.SHOES),
      this.clothingService.getItemsByCategory(ClothingCategory.JACKET),
      this.clothingService.getItemsByCategory(ClothingCategory.HAT)
    ]).pipe(
      map(([shirts, pants, shoes, jackets, hats]) => {
        // Filter out excluded items
        const availableShirts = this.filterExcludedItems(shirts, options.excludeItems);
        const availablePants = this.filterExcludedItems(pants, options.excludeItems);
        const availableShoes = this.filterExcludedItems(shoes, options.excludeItems);
        const availableJackets = this.filterExcludedItems(jackets, options.excludeItems);
        const availableHats = this.filterExcludedItems(hats, options.excludeItems);

        // Check if we have minimum required items
        if (availableShirts.length === 0 || availablePants.length === 0 || availableShoes.length === 0) {
          return null;
        }

        // Randomly select items
        const selectedShirt = this.getRandomItem(availableShirts);
        const selectedPants = this.getRandomItem(availablePants);
        const selectedShoes = this.getRandomItem(availableShoes);
        
        const outfitItems: OutfitItems = {
          shirt: selectedShirt,
          pants: selectedPants,
          shoes: selectedShoes
        };

        // Add optional items if requested and available
        if (options.includeJacket && availableJackets.length > 0) {
          outfitItems.jacket = this.getRandomItem(availableJackets);
        }

        if (options.includeHat && availableHats.length > 0) {
          outfitItems.hat = this.getRandomItem(availableHats);
        }

        // Create the outfit
        const outfit: Outfit = {
          id: uuidv4(),
          userId: 'local-user',
          items: outfitItems,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Set as current outfit
        this.currentOutfitSubject.next(outfit);

        return outfit;
      })
    );
  }

  /**
   * Save the current outfit
   */
  saveCurrentOutfit(name?: string): Observable<Outfit | null> {
    const currentOutfit = this.currentOutfitSubject.value;
    if (!currentOutfit) {
      return of(null);
    }

    const outfitToSave: Outfit = {
      ...currentOutfit,
      name,
      updatedAt: new Date()
    };

    const currentOutfits = this.outfitsSubject.value;
    const updatedOutfits = [...currentOutfits, outfitToSave];
    
    this.outfitsSubject.next(updatedOutfits);
    this.saveOutfitsToStorage(updatedOutfits);

    return of(outfitToSave);
  }

  /**
   * Get all saved outfits
   */
  getSavedOutfits(): Observable<Outfit[]> {
    return this.outfits$;
  }

  /**
   * Get favorite outfits
   */
  getFavoriteOutfits(): Observable<Outfit[]> {
    return this.outfits$.pipe(
      map(outfits => outfits.filter(outfit => outfit.isFavorite))
    );
  }

  /**
   * Toggle favorite status of an outfit
   */
  toggleOutfitFavorite(outfitId: string): Observable<Outfit | null> {
    const currentOutfits = this.outfitsSubject.value;
    const outfitIndex = currentOutfits.findIndex(outfit => outfit.id === outfitId);
    
    if (outfitIndex === -1) {
      return of(null);
    }

    const updatedOutfit = {
      ...currentOutfits[outfitIndex],
      isFavorite: !currentOutfits[outfitIndex].isFavorite,
      updatedAt: new Date()
    };

    const updatedOutfits = [...currentOutfits];
    updatedOutfits[outfitIndex] = updatedOutfit;
    
    this.outfitsSubject.next(updatedOutfits);
    this.saveOutfitsToStorage(updatedOutfits);

    return of(updatedOutfit);
  }

  /**
   * Delete an outfit
   */
  deleteOutfit(outfitId: string): Observable<boolean> {
    const currentOutfits = this.outfitsSubject.value;
    const updatedOutfits = currentOutfits.filter(outfit => outfit.id !== outfitId);
    
    this.outfitsSubject.next(updatedOutfits);
    this.saveOutfitsToStorage(updatedOutfits);

    return of(true);
  }

  /**
   * Set an existing outfit as current
   */
  setCurrentOutfit(outfit: Outfit): void {
    this.currentOutfitSubject.next(outfit);
  }

  /**
   * Clear current outfit
   */
  clearCurrentOutfit(): void {
    this.currentOutfitSubject.next(null);
  }

  /**
   * Get random item from array
   */
  private getRandomItem<T>(items: T[]): T {
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  }

  /**
   * Filter out excluded items
   */
  private filterExcludedItems(items: ClothingItem[], excludeItems?: string[]): ClothingItem[] {
    if (!excludeItems || excludeItems.length === 0) {
      return items;
    }
    return items.filter(item => !excludeItems.includes(item.id));
  }

  /**
   * Load outfits from localStorage
   */
  private loadOutfitsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const outfits: Outfit[] = JSON.parse(stored).map((outfit: any) => ({
          ...outfit,
          createdAt: new Date(outfit.createdAt),
          updatedAt: new Date(outfit.updatedAt)
        }));
        this.outfitsSubject.next(outfits);
      }
    } catch (error) {
      console.error('Failed to load outfits from storage:', error);
    }
  }

  /**
   * Save outfits to localStorage
   */
  private saveOutfitsToStorage(outfits: Outfit[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(outfits));
    } catch (error) {
      console.error('Failed to save outfits to storage:', error);
    }
  }

  /**
   * Clear all outfits (for development/testing)
   */
  clearAllOutfits(): void {
    this.outfitsSubject.next([]);
    this.currentOutfitSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get outfit statistics
   */
  getOutfitStats(): Observable<{
    totalOutfits: number;
    favoriteOutfits: number;
    mostUsedCategory: ClothingCategory | null;
  }> {
    return this.outfits$.pipe(
      map(outfits => {
        const totalOutfits = outfits.length;
        const favoriteOutfits = outfits.filter(outfit => outfit.isFavorite).length;
        
        // Count category usage
        const categoryCount: Record<ClothingCategory, number> = {
          [ClothingCategory.HAT]: 0,
          [ClothingCategory.SHIRT]: 0,
          [ClothingCategory.JACKET]: 0,
          [ClothingCategory.PANTS]: 0,
          [ClothingCategory.SHOES]: 0
        };

        outfits.forEach(outfit => {
          Object.values(outfit.items).forEach(item => {
            if (item) {
              categoryCount[item.category]++;
            }
          });
        });

        const mostUsedCategory = Object.entries(categoryCount)
          .reduce((max, [category, count]) => 
            count > max.count ? { category: category as ClothingCategory, count } : max,
            { category: null as ClothingCategory | null, count: 0 }
          ).category;

        return {
          totalOutfits,
          favoriteOutfits,
          mostUsedCategory
        };
      })
    );
  }
} 