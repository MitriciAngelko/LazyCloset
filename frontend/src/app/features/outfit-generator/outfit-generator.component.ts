import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ClothingService } from '../../core/services/clothing.service';
import { ClothingItem, ClothingCategory } from '../../shared/models/clothing.models';

interface OutfitLayer {
  category: ClothingCategory;
  displayName: string;
  items: ClothingItem[];
  currentIndex: number;
  zIndex: number;
}

@Component({
  selector: 'app-outfit-generator',
  standalone: false,
  templateUrl: './outfit-generator.component.html',
  styleUrl: './outfit-generator.component.scss'
})
export class OutfitGeneratorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  outfitLayers: OutfitLayer[] = [
    {
      category: ClothingCategory.HAT,
      displayName: 'Hats',
      items: [],
      currentIndex: 0,
      zIndex: 5
    },
    {
      category: ClothingCategory.TOP,
      displayName: 'Tops',
      items: [],
      currentIndex: 0,
      zIndex: 4
    },
    {
      category: ClothingCategory.JACKET,
      displayName: 'Jackets',
      items: [],
      currentIndex: 0,
      zIndex: 3
    },
    {
      category: ClothingCategory.JEANS,
      displayName: 'Jeans',
      items: [],
      currentIndex: 0,
      zIndex: 2
    },
    {
      category: ClothingCategory.SHOES,
      displayName: 'Shoes',
      items: [],
      currentIndex: 0,
      zIndex: 1
    }
  ];

  isLoading = true;

  constructor(
    private clothingService: ClothingService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadClothingItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load clothing items and organize by layers
   */
  private loadClothingItems(): void {
    this.clothingService.getClothingItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.organizeItemsByLayers(items);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load clothing items:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Organize items into outfit layers
   */
  private organizeItemsByLayers(items: ClothingItem[]): void {
    this.outfitLayers.forEach(layer => {
      layer.items = items.filter(item => item.category === layer.category);
      // Reset index if no items or current index is out of bounds
      if (layer.items.length === 0 || layer.currentIndex >= layer.items.length) {
        layer.currentIndex = 0;
      }
    });
  }

  /**
   * Navigate to previous item in a layer
   */
  previousItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;
    
    layer.currentIndex = layer.currentIndex > 0 
      ? layer.currentIndex - 1 
      : layer.items.length - 1;
  }

  /**
   * Navigate to next item in a layer
   */
  nextItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;
    
    layer.currentIndex = layer.currentIndex < layer.items.length - 1 
      ? layer.currentIndex + 1 
      : 0;
  }

  /**
   * Get current item for a layer
   */
  getCurrentItem(layer: OutfitLayer): ClothingItem | null {
    return layer.items.length > 0 ? layer.items[layer.currentIndex] : null;
  }

  /**
   * Check if layer has items
   */
  hasItems(layer: OutfitLayer): boolean {
    return layer.items.length > 0;
  }

  /**
   * Get layer position info for UI
   */
  getLayerInfo(layerIndex: number): string {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return 'No items';
    return `${layer.currentIndex + 1} of ${layer.items.length}`;
  }

  /**
   * Open upload modal
   */
  openUploadModal(): void {
    import('../upload/upload-modal/upload-modal.component').then(module => {
      const dialogRef = this.dialog.open(module.UploadModalComponent, {
        width: '600px',
        maxHeight: '90vh',
        disableClose: false,
        data: {}
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.success) {
          // Refresh the clothing items after successful upload
          this.loadClothingItems();
        }
      });
    });
  }

  /**
   * Generate random outfit
   */
  generateRandomOutfit(): void {
    this.outfitLayers.forEach(layer => {
      if (layer.items.length > 0) {
        layer.currentIndex = Math.floor(Math.random() * layer.items.length);
      }
    });
  }

  /**
   * Clear outfit (reset to first items)
   */
  clearOutfit(): void {
    this.outfitLayers.forEach(layer => {
      layer.currentIndex = 0;
    });
  }

  /**
   * Get category icon for display
   */
  getCategoryIcon(category: ClothingCategory): string {
    switch (category) {
      case ClothingCategory.HAT: return 'emoji_objects';
      case ClothingCategory.TOP: return 'checkroom';
      case ClothingCategory.JACKET: return 'ac_unit';
      case ClothingCategory.JEANS: return 'content_cut';
      case ClothingCategory.SHOES: return 'directions_walk';
      default: return 'checkroom';
    }
  }

  /**
   * Check if any layer has items
   */
  hasAnyItems(): boolean {
    return this.outfitLayers.some(layer => layer.items.length > 0);
  }
} 