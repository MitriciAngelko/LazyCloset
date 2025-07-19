import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClothingService } from '../../../core/services/clothing.service';
import { ClothingItem, ClothingCategory, ClothingColor } from '../../../shared/models';

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
  searchTerm = '';
  showOnlyFavorites = false;
  
  // UI state
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  readonly categories = Object.values(ClothingCategory);
  
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<ClothingCategory | 'all'>('all');
  private favoritesSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private clothingService: ClothingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadClothingItems();
    this.setupFilters();
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
      this.favoritesSubject
    ]).pipe(
      map(([items, search, category, favorites]) => {
        return items.filter(item => {
          // Search filter
          const matchesSearch = !search || 
            item.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

          // Category filter
          const matchesCategory = category === 'all' || item.category === category;

          // Favorites filter
          const matchesFavorites = !favorites || item.isFavorite;

          return matchesSearch && matchesCategory && matchesFavorites;
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
   * Get category display name
   */
  getCategoryDisplayName(category: ClothingCategory | 'all'): string {
    if (category === 'all') return 'All Items';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get color display for item
   */
  getColorDisplay(colors: ClothingColor[]): string {
    if (colors.length === 0) return 'No colors specified';
    if (colors.length === 1) return colors[0].charAt(0).toUpperCase() + colors[0].slice(1);
    return `${colors.length} colors`;
  }

  /**
   * Get formatted date
   */
  getFormattedDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.showOnlyFavorites = false;
    
    this.searchSubject.next('');
    this.categorySubject.next('all');
    this.favoritesSubject.next(false);
  }

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
   * Track by function for ngFor performance
   */
  trackByItemId(index: number, item: ClothingItem): string {
    return item.id;
  }
}
