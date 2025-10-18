import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ClothingService } from '../../../core/services/clothing.service';
import { LilGuyService, LilGuyState, ClothingItemPosition } from '../../../core/services/lil-guy.service';
import { ClothingItem, ClothingCategory } from '../../../shared/models/clothing.models';

/**
 * Interface representing a layer of clothing items in the outfit
 */
interface OutfitLayer {
  category: ClothingCategory;
  displayName: string;
  items: ClothingItem[];
  currentIndex: number;
  zIndex: number;
}

/**
 * Outfit Generator Modal Component
 * Allows users to create outfits by selecting and positioning clothing items.
 * Features draggable items, category navigation, and "lil guy" character integration.
 */
@Component({
  selector: 'app-outfit-generator-modal',
  standalone: false,
  templateUrl: './outfit-generator-modal.component.html',
  styleUrls: ['./outfit-generator-modal.component.scss']
})
export class OutfitGeneratorModalComponent implements OnInit, OnDestroy, AfterViewInit {
  // Public properties (inputs/outputs)
  @ViewChild('mannequinRef', { static: false }) mannequinRef!: ElementRef;

  // Private properties
  private readonly _destroy$ = new Subject<void>();

  // Public component state
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

  // Constructor (dependency injection only)
  constructor(
    private readonly clothingService: ClothingService,
    private readonly lilGuyService: LilGuyService,
    public readonly dialogRef: MatDialogRef<OutfitGeneratorModalComponent>
  ) {}

  // Lifecycle hooks (in order: OnInit, AfterViewInit, OnDestroy)
  ngOnInit(): void {
    this.loadClothingItems();
    this.initializeLilGuy();
  }

  ngAfterViewInit(): void {
    // Check connections after view initialization
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // Public methods (event handlers)

  /**
   * Handle previous item navigation for a clothing category
   */
  handlePreviousItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;

    layer.currentIndex = layer.currentIndex <= -1
      ? layer.items.length - 1
      : layer.currentIndex - 1;

    this.scheduleConnectionCheck();
  }

  /**
   * Handle next item navigation for a clothing category
   */
  handleNextItem(layerIndex: number): void {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return;

    layer.currentIndex = layer.currentIndex >= layer.items.length - 1
      ? -1
      : layer.currentIndex + 1;

    this.scheduleConnectionCheck();
  }

  /**
   * Handle randomize outfit action
   */
  handleRandomizeOutfit(): void {
    this.outfitLayers.forEach(layer => {
      if (layer.items.length > 0) {
        layer.currentIndex = Math.floor(Math.random() * layer.items.length);
      }
    });
    this.scheduleConnectionCheck();
  }

  /**
   * Handle clear outfit action
   */
  handleClearOutfit(): void {
    this.outfitLayers.forEach(layer => {
      layer.currentIndex = -1;
    });
    this.scheduleConnectionCheck();
  }

  /**
   * Handle save outfit action
   */
  handleSaveOutfit(): void {
    // TODO: [High] Implement outfit saving functionality
    console.log('Save outfit - to be implemented');

    const currentOutfit = {
      hat: this.getCurrentItem(this.getLayer('hat')!),
      top: this.getCurrentItem(this.getLayer('top')!),
      jacket: this.getCurrentItem(this.getLayer('jacket')!),
      jeans: this.getCurrentItem(this.getLayer('jeans')!),
      shoes: this.getCurrentItem(this.getLayer('shoes')!)
    };

    console.log('Current outfit:', currentOutfit);
  }

  /**
   * Handle drag started event
   */
  handleDragStarted(): void {
    // Optional: Add visual feedback when dragging starts
  }

  /**
   * Handle drag ended event
   */
  handleDragEnded(): void {
    this.scheduleConnectionCheck();
  }

  /**
   * Handle drag dropped event
   */
  handleDragDropped(event: CdkDragDrop<any>): void {
    const element = event.item.element.nativeElement;
    const transform = element.style.transform;
    element.style.transform = transform;
  }

  /**
   * Handle modal close event
   */
  handleClose(): void {
    this.dialogRef.close();
  }

  // Helper/utility methods for template

  /**
   * Get current item for a given layer
   */
  getCurrentItem(layer: OutfitLayer): ClothingItem | null {
    return layer.items.length > 0 && layer.currentIndex >= 0 && layer.currentIndex < layer.items.length
      ? layer.items[layer.currentIndex]
      : null;
  }

  /**
   * Check if layer has items
   */
  hasItems(layer: OutfitLayer): boolean {
    return layer.items.length > 0;
  }

  /**
   * Get display info for a layer
   */
  getLayerInfo(layerIndex: number): string {
    const layer = this.outfitLayers[layerIndex];
    if (layer.items.length === 0) return 'No items';
    if (layer.currentIndex === -1) return `0 of ${layer.items.length}`;
    return `${layer.currentIndex + 1} of ${layer.items.length}`;
  }

  /**
   * Check if there are any items in the closet
   */
  hasAnyItems(): boolean {
    return this.outfitLayers.some(layer => layer.items.length > 0);
  }

  /**
   * Get layer by category string
   */
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

  /**
   * Get layer index by category
   */
  getLayerIndex(category: ClothingCategory): number {
    return this.outfitLayers.findIndex(layer => layer.category === category);
  }

  // Private methods

  /**
   * Load clothing items from service
   */
  private loadClothingItems(): void {
    this.clothingService.getClothingItems()
      .pipe(takeUntil(this._destroy$))
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
   * Schedule connection check with debounce
   */
  private scheduleConnectionCheck(): void {
    setTimeout(() => {
      this.checkClothingConnections();
    }, 100);
  }

  /**
   * Organize clothing items by layers/categories
   */
  private organizeItemsByLayers(items: ClothingItem[]): void {
    this.outfitLayers.forEach(layer => {
      layer.items = items.filter(item => item.category === layer.category);
      if (layer.items.length === 0) {
        layer.currentIndex = -1;
      } else if (layer.currentIndex >= layer.items.length) {
        layer.currentIndex = -1;
      }
    });

    // Auto-generate a random outfit when items are loaded
    this.handleRandomizeOutfit();

    // Always initialize jacket with no item selected (index -1 = "0 of N")
    const jacketLayer = this.getLayer('jacket');
    if (jacketLayer) {
      jacketLayer.currentIndex = -1;
    }
  }

  /**
   * Initialize lil guy character state
   */
  private initializeLilGuy(): void {
    // Randomize the character when entering the outfit creator
    this.lilGuyService.randomizeCharacter();

    // Subscribe to lil guy state changes
    this.lilGuyService.lilGuyState$
      .pipe(takeUntil(this._destroy$))
      .subscribe(state => {
        this.lilGuyState = state;
        // Update positions when lil guy state changes
        setTimeout(() => {
          this.updateLilGuyPositions();
        }, 50);
      });
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