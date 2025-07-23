import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ClothingService } from '../../../core/services/clothing.service';
import { LilGuyService, LilGuyState, ClothingItemPosition } from '../../../core/services/lil-guy.service';
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
export class OutfitGeneratorModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mannequinRef', { static: false }) mannequinRef!: ElementRef;
  
  private destroy$ = new Subject<void>();
  
  // Lil Guy state
  lilGuyState: LilGuyState | null = null;
  
  // Dynamic positioning for lil guy parts
  headPosition = { x: 50, y: 15 }; // Default center position (percentages)
  leftHandPosition = { x: 20, y: 35 };
  rightHandPosition = { x: 80, y: 35 };
  
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
    private lilGuyService: LilGuyService,
    public dialogRef: MatDialogRef<OutfitGeneratorModalComponent>
  ) {}

  ngOnInit(): void {
    this.loadClothingItems();
    this.initializeLilGuy();
  }

  ngAfterViewInit(): void {
    // Check connections whenever clothing positions might change
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
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
    
    // Check connections after items are organized
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
  }

  private initializeLilGuy(): void {
    // Randomize the character when entering the outfit creator
    this.lilGuyService.randomizeCharacter();
    
    // Subscribe to lil guy state changes
    this.lilGuyService.lilGuyState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.lilGuyState = state;
        // Update positions when lil guy state changes
        setTimeout(() => {
          this.updateLilGuyPositions();
        }, 50);
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
    
    // Check connections after changing item
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
  }

  nextItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;
    
    if (layer.currentIndex >= layer.items.length - 1) {
      layer.currentIndex = -1;
    } else {
      layer.currentIndex = layer.currentIndex + 1;
    }
    
    // Check connections after changing item
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
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
    
    // Check connections after generating outfit
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
  }

  clearOutfit(): void {
    this.outfitLayers.forEach(layer => {
      layer.currentIndex = -1;
    });
    
    // Check connections (should make lil guy dead since no clothes)
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
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
    // Check connections after drag ends
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
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

  /**
   * Check if clothing items are connected and update lil guy state
   */
  private checkClothingConnections(): void {
    if (!this.mannequinRef) return;

    const clothingPositions: ClothingItemPosition[] = [];
    const mannequinRect = this.mannequinRef.nativeElement.getBoundingClientRect();

    // Get positions of all currently displayed clothing items
    this.outfitLayers.forEach(layer => {
      const currentItem = this.getCurrentItem(layer);
      if (currentItem) {
        const layerClass = this.getLayerClassName(layer.category);
        const element = this.mannequinRef.nativeElement.querySelector(`.${layerClass}`);
        
        if (element) {
          const rect = element.getBoundingClientRect();
          clothingPositions.push({
            id: currentItem.id,
            x: rect.left - mannequinRect.left,
            y: rect.top - mannequinRect.top,
            width: rect.width,
            height: rect.height
          });
        }
      }
    });

    // Update lil guy positions based on clothing
    this.updateLilGuyPositions();
    
    // Update lil guy state based on connections
    this.lilGuyService.checkClothingConnection(clothingPositions);
  }

  /**
   * Update lil guy head and hand positions based on clothing items
   */
  private updateLilGuyPositions(): void {
    if (!this.mannequinRef) return;

    const mannequinRect = this.mannequinRef.nativeElement.getBoundingClientRect();
    
    // Find hat and top items
    const hatLayer = this.getLayer('hat');
    const topLayer = this.getLayer('top');
    
    const hatItem = hatLayer ? this.getCurrentItem(hatLayer) : null;
    const topItem = topLayer ? this.getCurrentItem(topLayer) : null;

    // Position head: attach to hat if available, otherwise to top
    const headAttachmentItem = hatItem || topItem;
    if (headAttachmentItem) {
      const attachmentLayer = hatItem ? 'hat-layer' : 'top-layer';
      const element = this.mannequinRef.nativeElement.querySelector(`.${attachmentLayer}`);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const relativeX = ((rect.left + rect.width / 2) - mannequinRect.left) / mannequinRect.width * 100;
        
        // Position head differently for hat vs top
        let relativeY: number;
        if (hatItem) {
          // For hat: position head lower (more below the hat)
          relativeY = ((rect.bottom + rect.height * 0.4) - mannequinRect.top) / mannequinRect.height * 100;
        } else {
          // For top: position head at the top edge of the top item (like it's "wearing" it)
          relativeY = ((rect.top + rect.height * 0.2) - mannequinRect.top) / mannequinRect.height * 100;
        }
        
        this.headPosition = {
          x: Math.max(10, Math.min(90, relativeX + 5)), // Move 5% to the right
          y: Math.max(5, Math.min(95, relativeY))
        };
      }
    } else {
      // Default position if no items
      this.headPosition = { x: 50, y: 15 };
    }

    // Position hands: attach to top item
    if (topItem) {
      const element = this.mannequinRef.nativeElement.querySelector('.top-layer');
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const itemWidth = rect.width / mannequinRect.width * 100;
        const centerX = ((rect.left + rect.width / 2) - mannequinRect.left) / mannequinRect.width * 100;
        const centerY = ((rect.top + rect.height / 2) - mannequinRect.top) / mannequinRect.height * 100;
        
        // Position hands closer to the edges of the actual top item
        const handOffset = Math.max(8, itemWidth * 0.2); // 20% of item width or minimum 8% (closer)
        
        this.leftHandPosition = {
          x: Math.max(5, Math.min(45, centerX - handOffset)), // Closer to left edge of item
          y: Math.max(5, Math.min(95, centerY))
        };
        
        this.rightHandPosition = {
          x: Math.max(55, Math.min(95, centerX + handOffset)), // Closer to right edge of item
          y: Math.max(5, Math.min(95, centerY))
        };
      }
    } else {
      // Default positions if no top item
      this.leftHandPosition = { x: 20, y: 35 };
      this.rightHandPosition = { x: 80, y: 35 };
    }
  }

  /**
   * Get CSS class name for clothing layer
   */
  private getLayerClassName(category: ClothingCategory): string {
    const classMap: { [key in ClothingCategory]: string } = {
      [ClothingCategory.HAT]: 'hat-layer',
      [ClothingCategory.TOP]: 'top-layer',
      [ClothingCategory.JACKET]: 'jacket-layer',
      [ClothingCategory.JEANS]: 'jeans-layer',
      [ClothingCategory.SHOES]: 'shoes-layer'
    };
    return classMap[category] || 'unknown-layer';
  }


} 