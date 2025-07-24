import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, combineLatest, BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ClothingService } from '../../../core/services/clothing.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CategoryService, CategoryInfo } from '../../../core/services/category.service';
import { ClothingItem, ClothingCategory, ClothingColor } from '../../../shared/models/clothing.models';
import { ItemEditModalComponent } from '../item-edit-modal/item-edit-modal.component';
import { OutfitGeneratorModalComponent } from '../outfit-generator-modal/outfit-generator-modal.component';

interface ModernColor {
  name: string;
  value: string;
}

interface DraggableClothingItem extends ClothingItem {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
}

@Component({
  selector: 'app-closet-view',
  standalone: false,
  templateUrl: './closet-view.component.html',
  styleUrl: './closet-view.component.scss'
})
export class ClosetViewComponent implements OnInit, OnDestroy {
  @ViewChild('containerRef', { static: false }) containerRef!: ElementRef;
  
  private destroy$ = new Subject<void>();
  
  clothingItems: DraggableClothingItem[] = [];
  filteredItems: DraggableClothingItem[] = [];
  
  // Filter controls
  selectedCategory: ClothingCategory | 'all' = 'all';
  selectedColors: ClothingColor[] = [];
  selectedModernColors: string[] = []; // NEW: Modern color filtering
  searchTerm = '';
  showOnlyFavorites = false;
  
  // UI state
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  // Layout mode for positioning
  layoutMode: 'scatter' | 'grid' = 'scatter';
  
  // Drag and Drop state
  draggedItem: string | null = null;
  dragOffset = { x: 0, y: 0 };
  hoveredItem: string | null = null;
  
  // Physics for natural dragging
  private lastMousePosition = { x: 0, y: 0 };
  private lastMoveTime = 0;
  private velocity = { x: 0, y: 0 };
  private isSliding = false;
  
  // Mouse tracking
  mousePosition = { x: 0, y: 0 };
  isFilterOpen = false;
  
  // Category options
  categoryOptions: (ClothingCategory | 'all')[] = [
    'all',
    ClothingCategory.HAT,
    ClothingCategory.TOP,
    ClothingCategory.JACKET,
    ClothingCategory.JEANS,
    ClothingCategory.SHOES
  ];
  
  // Modern color palette
  modernColors: ModernColor[] = [
    { name: "Terracotta", value: "#D4B5A0" },
    { name: "Navy", value: "#2C3E50" },
    { name: "Sage", value: "#B8C5A6" },
    { name: "Cream", value: "#F5F1EB" },
    { name: "Rust", value: "#C4A484" },
    { name: "Slate", value: "#34495E" },
    { name: "Sand", value: "#E8DDD4" },
    { name: "Forest", value: "#6B7A5A" }
  ];
  
  readonly categories = Object.values(ClothingCategory);
  readonly availableColors = Object.values(ClothingColor);
  categoryInfoList: CategoryInfo[] = [];
  
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<ClothingCategory | 'all'>('all');
  private colorSubject = new BehaviorSubject<ClothingColor[]>([]);
  private modernColorSubject = new BehaviorSubject<string[]>([]);
  private favoritesSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private clothingService: ClothingService,
    private supabaseService: SupabaseService,
    public categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.categoryInfoList = this.categoryService.getAllCategories();
  }

  ngOnInit(): void {
    this.supabaseService.currentUser$
      .pipe(
        filter(user => user !== null),
        takeUntil(this.destroy$)
      )
      .subscribe(user => {
        this.loadClothingItems();
        this.setupFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Category Helper =====

  getCategoryDisplayText(category: ClothingCategory | 'all'): string {
    if (category === 'all') return 'All';
    return this.getCategoryDisplayName(category);
  }

  // ===== Drag and Drop Methods =====

  onItemMouseDown(event: MouseEvent, item: DraggableClothingItem): void {
    // Don't start drag if clicking on edit or favorite buttons
    const target = event.target as HTMLElement;
    if (target.closest('.floating-edit-btn') || target.closest('.floating-favorite-btn')) {
      return;
    }
    
    event.preventDefault();
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    this.draggedItem = item.id;
    this.dragOffset = {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2
    };
    
    // Initialize physics tracking
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
    this.lastMoveTime = Date.now();
    this.velocity = { x: 0, y: 0 };
    this.isSliding = false;
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (this.draggedItem && !this.isSliding) {
      // Apply momentum when releasing
      this.startSliding();
    }
    
    this.draggedItem = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  onMouseMove(event: MouseEvent): void {
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    
    this.mousePosition = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    };

    // Handle dragging - make it super responsive
    if (this.draggedItem !== null && !this.isSliding) {
      const currentTime = Date.now();
      const deltaTime = Math.max(currentTime - this.lastMoveTime, 1); // Prevent division by zero
      
      // Calculate velocity for momentum
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;
      
      this.velocity = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime
      };

      // Calculate new position - DIRECT tracking, no lag
      const newX = ((event.clientX - rect.left - this.dragOffset.x) / rect.width) * 100;
      const newY = ((event.clientY - rect.top - this.dragOffset.y) / rect.height) * 100;

      // Update position immediately
      this.updateItemPosition(newX, newY);
      
      // Update tracking
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      this.lastMoveTime = currentTime;
    }
  }

  private updateItemPosition(newX: number, newY: number): void {
    const clampedX = Math.max(5, Math.min(95, newX));
    const clampedY = Math.max(35, Math.min(90, newY)); // Prevent dragging above search bar

    this.clothingItems = this.clothingItems.map(item =>
      item.id === this.draggedItem
        ? { ...item, x: clampedX, y: clampedY }
        : item
    );
    
    // Update filtered items as well
    this.filteredItems = this.filteredItems.map(item =>
      item.id === this.draggedItem
        ? { ...item, x: clampedX, y: clampedY }
        : item
    );
  }

  private startSliding(): void {
    const draggedItemId = this.draggedItem;
    if (!draggedItemId) return;
    
    // Only slide if there's significant velocity
    const totalVelocity = Math.abs(this.velocity.x) + Math.abs(this.velocity.y);
    
    if (totalVelocity < 0.2) return; // Lower threshold for more sliding
    
    this.isSliding = true;
    const friction = 0.94; // Slightly less friction for longer slides
    const minVelocity = 0.02; // Lower minimum for smoother stops
    
    const animate = () => {
      if (!this.isSliding) return;
      
      // Apply friction
      this.velocity.x *= friction;
      this.velocity.y *= friction;
      
      // Check if we should stop
      if (Math.abs(this.velocity.x) < minVelocity && Math.abs(this.velocity.y) < minVelocity) {
        this.isSliding = false;
        return;
      }
      
      // Get current item position
      const item = this.clothingItems.find(i => i.id === draggedItemId);
      if (!item) {
        this.isSliding = false;
        return;
      }
      
      // Calculate new position with momentum
      const newX = (item.x || 0) + this.velocity.x * 25; // Increased scaling for more visible sliding
      const newY = (item.y || 0) + this.velocity.y * 25;
      
      this.updateItemPosition(newX, newY);
      
      // Trigger change detection for smooth animation
      this.cdr.detectChanges();
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start the sliding animation
    requestAnimationFrame(animate);
  }

  // ===== Scatter Items Feature =====

  toggleLayoutMode(): void {
    if (this.layoutMode === 'scatter') {
      this.layoutMode = 'grid';
      this.arrangeInGrid();
    } else {
      this.layoutMode = 'scatter';
      this.scatterItems();
    }
  }

  scatterItems(): void {
    this.layoutMode = 'scatter';
    this.clothingItems = this.clothingItems.map(item => ({
      ...item,
      x: Math.random() * 80 + 10,
      y: Math.random() * 50 + 35, // Restricted to 35% - 85% (below search bar)
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.8 + Math.random() * 0.4
    }));
    
    // Update filtered items with new positions
    this.filteredItems = this.filteredItems.map(item => {
      const originalItem = this.clothingItems.find(orig => orig.id === item.id);
      return originalItem ? { ...item, ...originalItem } : item;
    });
  }

  arrangeInGrid(): void {
    this.layoutMode = 'grid';
    
    // Calculate grid parameters
    const itemsPerRow = 6; // Adjust based on your preference
    const startX = 12; // Left margin
    const startY = 35; // Start below search bar (35% from top)
    const spacingX = (75) / (itemsPerRow - 1); // Space between items horizontally
    const spacingY = 12; // Reduced spacing for more rows in available space
    
    // Arrange all items in grid
    this.clothingItems = this.clothingItems.map((item, index) => ({
      ...item,
      x: startX + (index % itemsPerRow) * spacingX,
      y: startY + Math.floor(index / itemsPerRow) * spacingY,
      rotation: 0, // No rotation in grid mode
      scale: 0.9 // Consistent scale in grid mode
    }));
    
    // Update filtered items with new positions - but arrange filtered items in their own grid
    this.arrangeFilteredItemsInGrid();
  }

  private arrangeFilteredItemsInGrid(): void {
    if (this.layoutMode !== 'grid') return;
    
    const itemsPerRow = 6;
    const startX = 12;
    const startY = 35; // Start below search bar
    const spacingX = (75) / (itemsPerRow - 1);
    const spacingY = 12; // Reduced spacing
    
    // Arrange only the filtered items in a clean grid
    this.filteredItems = this.filteredItems.map((item, index) => ({
      ...item,
      x: startX + (index % itemsPerRow) * spacingX,
      y: startY + Math.floor(index / itemsPerRow) * spacingY,
      rotation: 0,
      scale: 0.9
    }));
  }

  // ===== Floating Items Transform & Style Methods =====

  getFloatingItemTransform(item: DraggableClothingItem, index: number): string {
    // When dragging, use simple transform to avoid lag
    if (this.draggedItem === item.id) {
      return `translate(-50%, -50%)`;
    }
    
    // For non-dragged items, use organic positioning
    const rotation = item.rotation || ((index % 7 - 3) * 5);
    const scale = item.scale || (0.8 + (index % 5) * 0.1); // More consistent scaling
    
    return `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  }

  getFloatingItemFilter(item: DraggableClothingItem): string {
    const shadowIntensity = this.draggedItem === item.id ? "20px 25px" : "10px 15px";
    return `drop-shadow(0 ${shadowIntensity} rgba(44, 62, 80, 0.2))`;
  }

  getImageFilter(item: DraggableClothingItem): string {
    const brightness = this.draggedItem === item.id ? 1.1 : 1;
    const contrast = this.draggedItem === item.id ? 1.1 : 1;
    return `brightness(${brightness}) contrast(${contrast})`;
  }

  getBackgroundStyle(): string {
    return `
      radial-gradient(circle at ${this.mousePosition.x}% ${this.mousePosition.y}%, rgba(180, 197, 166, 0.08) 0%, transparent 50%),
      linear-gradient(135deg, #F5F1EB 0%, #E8DDD4 50%, #DDD5CC 100%)
    `;
  }

  // ===== Modern Color Filtering =====

  isModernColorSelected(colorValue: string): boolean {
    return this.selectedModernColors.includes(colorValue);
  }

  toggleModernColorFilter(colorValue: string): void {
    const index = this.selectedModernColors.indexOf(colorValue);
    if (index > -1) {
      this.selectedModernColors.splice(index, 1);
    } else {
      this.selectedModernColors.push(colorValue);
    }
    this.modernColorSubject.next([...this.selectedModernColors]);
  }

  // ===== Original Methods (Updated) =====

  toggleFilters(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  getItemPosition(index: number, axis: 'x' | 'y'): number {
    const positions = [
      { x: 15, y: 40 }, { x: 65, y: 38 }, { x: 35, y: 55 }, { x: 80, y: 45 },
      { x: 20, y: 70 }, { x: 75, y: 65 }, { x: 45, y: 42 }, { x: 25, y: 82 },
      { x: 70, y: 78 }, { x: 50, y: 68 }, { x: 10, y: 52 }, { x: 85, y: 72 },
      { x: 40, y: 85 }, { x: 60, y: 48 }, { x: 30, y: 58 }
    ];
    
    const position = positions[index % positions.length];
    const offset = (index * 7) % 15 - 7.5;
    
    if (axis === 'x') {
      return Math.max(5, Math.min(95, position.x + offset));
    } else {
      // Ensure y positions are below search bar (minimum 35%)
      return Math.max(35, Math.min(85, position.y + offset));
    }
  }

  private loadClothingItems(): void {
    this.clothingService.getClothingItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          // Initialize items with random positions if not set
          this.clothingItems = items.map((item, index) => ({
            ...item,
            x: (item as any).x || Math.random() * 80 + 10,
            y: (item as any).y || Math.random() * 50 + 35, // Below search bar
            rotation: (item as any).rotation || (Math.random() - 0.5) * 30,
            scale: (item as any).scale || (0.8 + Math.random() * 0.4)
          }));
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

  private setupFilters(): void {
    combineLatest([
      this.clothingService.getClothingItems(),
      this.searchSubject,
      this.categorySubject,
      this.colorSubject,
      this.modernColorSubject,
      this.favoritesSubject
    ]).pipe(
      map(([items, search, category, colors, modernColors, favorites]) => {
        return items.map((item, index) => ({
          ...item,
          x: (item as any).x || Math.random() * 80 + 10,
          y: (item as any).y || Math.random() * 50 + 35, // Below search bar
          rotation: (item as any).rotation || (Math.random() - 0.5) * 30,
          scale: (item as any).scale || (0.8 + Math.random() * 0.4)
        })).filter(item => {
          const matchesSearch = !search || 
            item.originalFileName.toLowerCase().includes(search.toLowerCase());

          const matchesCategory = category === 'all' || item.category === category;

          const matchesColors = colors.length === 0 || 
            colors.some(selectedColor => item.colors.includes(selectedColor));

          // Modern color filter (if any modern colors are selected)
          const matchesModernColors = modernColors.length === 0 || true; // For now, skip modern color filtering on actual items

          const matchesFavorites = !favorites || item.isFavorite;

          return matchesSearch && matchesCategory && matchesColors && matchesModernColors && matchesFavorites;
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe(filteredItems => {
      this.filteredItems = filteredItems;
      // Only arrange in grid if we're in grid mode and not currently dragging
      if (this.layoutMode === 'grid' && !this.draggedItem) {
        this.arrangeFilteredItemsInGrid();
      }
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  onCategoryChange(category: ClothingCategory | 'all'): void {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  onToggleFavorites(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.favoritesSubject.next(this.showOnlyFavorites);
  }

  toggleColorFilter(color: ClothingColor): void {
    const index = this.selectedColors.indexOf(color);
    if (index > -1) {
      this.selectedColors.splice(index, 1);
    } else {
      this.selectedColors.push(color);
    }
    this.colorSubject.next([...this.selectedColors]);
  }

  isColorFilterSelected(color: ClothingColor): boolean {
    return this.selectedColors.includes(color);
  }

  clearAllFilters(): void {
    this.selectedCategory = 'all';
    this.selectedColors = [];
    this.selectedModernColors = [];
    this.showOnlyFavorites = false;
    this.searchTerm = '';
    
    this.categorySubject.next('all');
    this.colorSubject.next([]);
    this.modernColorSubject.next([]);
    this.favoritesSubject.next(false);
    this.searchSubject.next('');
  }

  getCategoryDisplayName(category: ClothingCategory | 'all'): string {
    if (category === 'all') return 'All Categories';
    
    const categoryInfo = this.categoryService.getCategoryInfo(category);
    return categoryInfo?.displayName || category;
  }

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

  editItem(item: ClothingItem): void {
    const dialogRef = this.dialog.open(ItemEditModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: { item },
      disableClose: false,
      panelClass: 'edit-modal-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedItem => {
        if (updatedItem) {
          console.log('Item updated successfully:', updatedItem);
        }
      });
  }

  openUploadModal(): void {
    import('../../upload/upload-modal/upload-modal.component').then(module => {
      const dialogRef = this.dialog.open(module.UploadModalComponent, {
        width: '1000px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        disableClose: false,
        data: {},
        panelClass: 'upload-modal-dialog'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.success) {
          console.log('New item uploaded successfully');
        }
      });
    });
  }

  openOutfitGenerator(): void {
    const dialogRef = this.dialog.open(OutfitGeneratorModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: false,
      panelClass: 'outfit-generator-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Outfit generator closed');
    });
  }

  trackByItemId(index: number, item: ClothingItem): string {
    return item.id;
  }
}
