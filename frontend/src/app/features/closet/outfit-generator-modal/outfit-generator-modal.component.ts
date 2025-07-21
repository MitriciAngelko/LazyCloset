import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ClothingService } from '../../../core/services/clothing.service';
import { ClothingItem, ClothingCategory } from '../../../shared/models/clothing.models';

interface OutfitLayer {
  category: ClothingCategory;
  displayName: string;
  items: ClothingItem[];
  currentIndex: number;
  zIndex: number;
}

@Component({
  selector: 'app-outfit-generator-modal',
  standalone: false,
  templateUrl: './outfit-generator-modal.component.html',
  styleUrls: ['./outfit-generator-modal.component.scss']
})
export class OutfitGeneratorModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  outfitLayers: OutfitLayer[] = [
    {
      category: ClothingCategory.HAT,
      displayName: 'Hats',
      items: [],
      currentIndex: -1,
      zIndex: 5
    },
    {
      category: ClothingCategory.TOP,
      displayName: 'Tops',
      items: [],
      currentIndex: -1,
      zIndex: 4
    },
    {
      category: ClothingCategory.JACKET,
      displayName: 'Jackets',
      items: [],
      currentIndex: -1,
      zIndex: 3
    },
    {
      category: ClothingCategory.JEANS,
      displayName: 'Jeans',
      items: [],
      currentIndex: -1,
      zIndex: 2
    },
    {
      category: ClothingCategory.SHOES,
      displayName: 'Shoes',
      items: [],
      currentIndex: -1,
      zIndex: 1
    }
  ];

  isLoading = true;

  constructor(
    private clothingService: ClothingService,
    public dialogRef: MatDialogRef<OutfitGeneratorModalComponent>
  ) {}

  ngOnInit(): void {
    this.loadClothingItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  private organizeItemsByLayers(items: ClothingItem[]): void {
    this.outfitLayers.forEach(layer => {
      layer.items = items.filter(item => item.category === layer.category);
      if (layer.items.length === 0) {
        layer.currentIndex = -1;
      } else if (layer.currentIndex >= layer.items.length) {
        layer.currentIndex = -1;
      }
    });
  }

  previousItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;
    
    if (layer.currentIndex <= -1) {
      layer.currentIndex = layer.items.length - 1;
    } else {
      layer.currentIndex = layer.currentIndex - 1;
    }
  }

  nextItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;
    
    if (layer.currentIndex >= layer.items.length - 1) {
      layer.currentIndex = -1;
    } else {
      layer.currentIndex = layer.currentIndex + 1;
    }
  }

  getCurrentItem(layer: OutfitLayer): ClothingItem | null {
    return layer.items.length > 0 && layer.currentIndex >= 0 && layer.currentIndex < layer.items.length 
      ? layer.items[layer.currentIndex] 
      : null;
  }

  hasItems(layer: OutfitLayer): boolean {
    return layer.items.length > 0;
  }

  getLayerInfo(layerIndex: number): string {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return 'No items';
    if (layer.currentIndex === -1) return `0 of ${layer.items.length}`;
    return `${layer.currentIndex + 1} of ${layer.items.length}`;
  }

  generateRandomOutfit(): void {
    this.outfitLayers.forEach(layer => {
      if (layer.items.length > 0) {
        layer.currentIndex = Math.floor(Math.random() * layer.items.length);
      }
    });
  }

  clearOutfit(): void {
    this.outfitLayers.forEach(layer => {
      layer.currentIndex = -1;
    });
  }

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

  hasAnyItems(): boolean {
    return this.outfitLayers.some(layer => layer.items.length > 0);
  }

  getLayer(categoryStr: string): OutfitLayer | null {
    const categoryMap: { [key: string]: ClothingCategory } = {
      'hat': ClothingCategory.HAT,
      'top': ClothingCategory.TOP,
      'jacket': ClothingCategory.JACKET,
      'jeans': ClothingCategory.JEANS,
      'shoes': ClothingCategory.SHOES
    };
    
    const category = categoryMap[categoryStr];
    return this.outfitLayers.find(layer => layer.category === category) || null;
  }

  getLayerIndex(category: ClothingCategory): number {
    return this.outfitLayers.findIndex(layer => layer.category === category);
  }

  onDragDropped(event: CdkDragDrop<any>): void {
    const element = event.item.element.nativeElement;
    const transform = element.style.transform;
    element.style.transform = transform;
  }

  onDragStarted(): void {
    // Optional: Add visual feedback when dragging starts
  }

  onDragEnded(): void {
    // Optional: Clean up after drag ends
  }

  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Save the current outfit (placeholder for future implementation)
   */
  saveOutfit(): void {
    // TODO: Implement outfit saving functionality
    console.log('Save outfit functionality - to be implemented');
    
    // Get current outfit items
    const currentOutfit = {
      hat: this.getCurrentItem(this.getLayer('hat')!),
      top: this.getCurrentItem(this.getLayer('top')!),
      jacket: this.getCurrentItem(this.getLayer('jacket')!),
      jeans: this.getCurrentItem(this.getLayer('jeans')!),
      shoes: this.getCurrentItem(this.getLayer('shoes')!)
    };
    
    // For now, just log the outfit
    console.log('Current outfit to save:', currentOutfit);
    
    // Future: Save to backend, show success message, etc.
  }
} 