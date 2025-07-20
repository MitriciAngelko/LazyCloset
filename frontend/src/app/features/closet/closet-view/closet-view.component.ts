import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ClothingService } from '../../../core/services/clothing.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CategoryService, CategoryInfo } from '../../../core/services/category.service';
import { ClothingItem, ClothingCategory, ClothingColor } from '../../../shared/models/clothing.models';

@Component({
  selector: 'app-closet-view',
  standalone: false,
  templateUrl: './closet-view.component.html',
  styleUrl: './closet-view.component.scss'
})
export class ClosetViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  clothingItems: ClothingItem[] = [];
  filteredItems: ClothingItem[] = [];
  
  // Filter controls
  selectedCategory: ClothingCategory | 'all' = 'all';
  selectedColors: ClothingColor[] = []; // NEW: Color filtering
  searchTerm = '';
  showOnlyFavorites = false;
  
  // UI state
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  readonly categories = Object.values(ClothingCategory);
  readonly availableColors = Object.values(ClothingColor); // NEW: Available colors for filtering
  categoryInfoList: CategoryInfo[] = [];
  
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<ClothingCategory | 'all'>('all');
  private colorSubject = new BehaviorSubject<ClothingColor[]>([]); // NEW: Color filter subject
  private favoritesSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private clothingService: ClothingService,
    private supabaseService: SupabaseService,
    public categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.categoryInfoList = this.categoryService.getAllCategories();
  }

  ngOnInit(): void {
    // Wait for user authentication before loading items
    this.supabaseService.currentUser$
      .pipe(
        filter(user => user !== null), // Only proceed when user is authenticated
        takeUntil(this.destroy$)
      )
      .subscribe(user => {
        console.log('👤 Authenticated user in closet:', user?.email);
        this.loadClothingItems();
        this.setupFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all clothing items
   */
  private loadClothingItems(): void {
    this.clothingService.getClothingItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.clothingItems = items;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load clothing items:', error);
          this.isLoading = false;
          this.snackBar.open('Failed to load clothing items', 'Close', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Setup reactive filters
   */
  private setupFilters(): void {
    combineLatest([
      this.clothingService.getClothingItems(),
      this.searchSubject,
      this.categorySubject,
      this.colorSubject, // NEW: Color filter
      this.favoritesSubject
    ]).pipe(
      map(([items, search, category, colors, favorites]) => {
        return items.filter(item => {
          // Search filter
          const matchesSearch = !search || 
            item.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

          // Category filter
          const matchesCategory = category === 'all' || item.category === category;

          // NEW: Color filter - item must have at least one selected color
          const matchesColors = colors.length === 0 || 
            colors.some(selectedColor => item.colors.includes(selectedColor));

          // Favorites filter
          const matchesFavorites = !favorites || item.isFavorite;

          return matchesSearch && matchesCategory && matchesColors && matchesFavorites;
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe(filteredItems => {
      this.filteredItems = filteredItems;
    });
  }

  /**
   * Update search filter
   */
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  /**
   * Update category filter
   */
  onCategoryChange(category: ClothingCategory | 'all'): void {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  /**
   * Update color filter
   */
  onColorChange(colors: ClothingColor[]): void {
    this.selectedColors = colors;
    this.colorSubject.next(colors);
  }

  /**
   * Toggle favorites filter
   */
  onToggleFavorites(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.favoritesSubject.next(this.showOnlyFavorites);
  }

  /**
   * Toggle view mode
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // ===== PHASE 2: Color Filtering =====

  /**
   * Toggle color filter
   */
  toggleColorFilter(color: ClothingColor): void {
    const index = this.selectedColors.indexOf(color);
    if (index > -1) {
      this.selectedColors.splice(index, 1);
    } else {
      this.selectedColors.push(color);
    }
    this.colorSubject.next([...this.selectedColors]);
  }

  /**
   * Check if color filter is selected
   */
  isColorFilterSelected(color: ClothingColor): boolean {
    return this.selectedColors.includes(color);
  }

  /**
   * Clear all color filters
   */
  clearColorFilters(): void {
    this.selectedColors = [];
    this.colorSubject.next([]);
  }

  /**
   * Check if there are any active filters
   */
  hasActiveFilters(): boolean {
    return this.selectedCategory !== 'all' || 
           this.selectedColors.length > 0 || 
           this.showOnlyFavorites ||
           this.searchTerm.length > 0;
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.selectedCategory = 'all';
    this.selectedColors = [];
    this.showOnlyFavorites = false;
    this.searchTerm = '';
    
    this.categorySubject.next('all');
    this.colorSubject.next([]);
    this.favoritesSubject.next(false);
    this.searchSubject.next('');
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: ClothingCategory | 'all'): string {
    if (category === 'all') return 'All Categories';
    
    const categoryInfo = this.categoryService.getCategoryInfo(category);
    return categoryInfo?.displayName || category;
  }

  /**
   * Get color display name
   */
  getColorDisplayName(color: ClothingColor): string {
    const displayNames: { [key in ClothingColor]: string } = {
      [ClothingColor.RED]: 'Red',
      [ClothingColor.BLUE]: 'Blue',
      [ClothingColor.GREEN]: 'Green',
      [ClothingColor.BLACK]: 'Black',
      [ClothingColor.WHITE]: 'White',
      [ClothingColor.GRAY]: 'Gray',
      [ClothingColor.BROWN]: 'Brown',
      [ClothingColor.YELLOW]: 'Yellow',
      [ClothingColor.PURPLE]: 'Purple',
      [ClothingColor.ORANGE]: 'Orange',
      [ClothingColor.PINK]: 'Pink',
      [ClothingColor.NAVY]: 'Navy',
      [ClothingColor.BEIGE]: 'Beige'
    };
    return displayNames[color] || color;
  }

  /**
   * Get color hex value (simplified mapping)
   */
  getColorHex(color: ClothingColor): string {
    const colorHexMap: { [key in ClothingColor]: string } = {
      [ClothingColor.RED]: '#f44336',
      [ClothingColor.BLUE]: '#2196f3',
      [ClothingColor.GREEN]: '#4caf50',
      [ClothingColor.BLACK]: '#424242',
      [ClothingColor.WHITE]: '#fafafa',
      [ClothingColor.GRAY]: '#9e9e9e',
      [ClothingColor.BROWN]: '#795548',
      [ClothingColor.YELLOW]: '#ffeb3b',
      [ClothingColor.PURPLE]: '#9c27b0',
      [ClothingColor.ORANGE]: '#ff9800',
      [ClothingColor.PINK]: '#e91e63',
      [ClothingColor.NAVY]: '#1a237e',
      [ClothingColor.BEIGE]: '#f5f5dc'
    };
    return colorHexMap[color] || '#9e9e9e';
  }

  /**
   * Get appropriate text color for background
   */
  getTextColorForBackground(color: ClothingColor): string {
    const darkColors = [ClothingColor.BLACK, ClothingColor.NAVY, ClothingColor.BROWN, ClothingColor.PURPLE];
    return darkColors.includes(color) ? '#ffffff' : '#000000';
  }

  // ===== Helper Methods =====

  /**
   * Get items count text
   */
  getItemsCountText(): string {
    const total = this.clothingItems.length;
    const filtered = this.filteredItems.length;
    
    if (total === 0) return 'No items in your closet';
    if (filtered === total) return `${total} item${total !== 1 ? 's' : ''}`;
    return `${filtered} of ${total} item${total !== 1 ? 's' : ''}`;
  }

  /**
   * Get color display for item
   */
  getColorDisplay(colors: ClothingColor[] | readonly ClothingColor[]): string {
    if (colors.length === 0) return 'No colors specified';
    if (colors.length === 1) return this.getColorDisplayName(colors[0]);
    return `${colors.length} colors`;
  }

  /**
   * Get formatted date
   */
  getFormattedDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Toggle item favorite status
   */
  toggleFavorite(item: ClothingItem): void {
    this.clothingService.toggleFavorite(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedItem) => {
          if (updatedItem) {
            const message = updatedItem.isFavorite ? 'Added to favorites' : 'Removed from favorites';
            this.snackBar.open(message, 'Close', { duration: 2000 });
          }
        },
        error: (error) => {
          console.error('Failed to toggle favorite:', error);
          this.snackBar.open('Failed to update favorite status', 'Close', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Delete clothing item
   */
  deleteItem(item: ClothingItem): void {
    if (confirm(`Are you sure you want to delete "${item.originalFileName}"?`)) {
      this.clothingService.deleteClothingItem(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Item deleted successfully', 'Close', {
              duration: 2000
            });
          },
          error: (error) => {
            console.error('Failed to delete item:', error);
            this.snackBar.open('Failed to delete item', 'Close', {
              duration: 3000
            });
          }
        });
    }
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: ClothingCategory): string {
    const categoryInfo = this.categoryService.getCategoryInfo(category);
    return categoryInfo?.icon || 'checkroom';
  }

  /**
   * Track by function for ngFor performance
   */
  trackByItemId(index: number, item: ClothingItem): string {
    return item.id;
  }
}
