import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LilGuyVariation {
  headImage: string;
  leftHandImage: string;
  rightHandImage: string;
}

export interface LilGuyState {
  isAlive: boolean;
  currentVariation: LilGuyVariation;
}

export interface ClothingItemPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class LilGuyService {
  private readonly ASSET_PATH = 'assets/images/lil-guy/';
  
  private readonly aliveVariations: LilGuyVariation[] = [
    {
      headImage: `${this.ASSET_PATH}alive_1.png`,
      leftHandImage: `${this.ASSET_PATH}hand_left_1.png`,
      rightHandImage: `${this.ASSET_PATH}hand_right_1.png`
    },
    {
      headImage: `${this.ASSET_PATH}alive_2.png`,
      leftHandImage: `${this.ASSET_PATH}hand_left_2.png`,
      rightHandImage: `${this.ASSET_PATH}hand_right_1.png`
    }
  ];

  private readonly deadVariations: LilGuyVariation[] = [
    {
      headImage: `${this.ASSET_PATH}dead_1.png`,
      leftHandImage: `${this.ASSET_PATH}hand_left_1.png`,
      rightHandImage: `${this.ASSET_PATH}hand_right_1.png`
    },
    {
      headImage: `${this.ASSET_PATH}dead_2.png`,
      leftHandImage: `${this.ASSET_PATH}hand_left_2.png`,
      rightHandImage: `${this.ASSET_PATH}hand_right_1.png`
    }
  ];

  private lilGuyStateSubject = new BehaviorSubject<LilGuyState>({
    isAlive: true,
    currentVariation: this.getRandomAliveVariation()
  });

  public lilGuyState$ = this.lilGuyStateSubject.asObservable();

  constructor() {}

  /**
   * Get a random alive variation
   */
  private getRandomAliveVariation(): LilGuyVariation {
    const randomIndex = Math.floor(Math.random() * this.aliveVariations.length);
    return this.aliveVariations[randomIndex];
  }

  /**
   * Get a random dead variation
   */
  private getRandomDeadVariation(): LilGuyVariation {
    const randomIndex = Math.floor(Math.random() * this.deadVariations.length);
    return this.deadVariations[randomIndex];
  }

  /**
   * Randomize the character variation (called when entering outfit creator)
   */
  randomizeCharacter(): void {
    const currentState = this.lilGuyStateSubject.value;
    const newVariation = currentState.isAlive 
      ? this.getRandomAliveVariation() 
      : this.getRandomDeadVariation();
    
    this.lilGuyStateSubject.next({
      ...currentState,
      currentVariation: newVariation
    });
  }

  /**
   * Check if clothing items are connected/touching and update lil guy state
   */
  checkClothingConnection(clothingPositions: ClothingItemPosition[]): void {
    const isConnected = this.areClothingItemsConnected(clothingPositions);
    const currentState = this.lilGuyStateSubject.value;
    
    if (isConnected !== currentState.isAlive) {
      const newVariation = isConnected 
        ? this.getRandomAliveVariation() 
        : this.getRandomDeadVariation();
      
      this.lilGuyStateSubject.next({
        isAlive: isConnected,
        currentVariation: newVariation
      });
    }
  }

  /**
   * Algorithm to check if clothing items are connected/touching
   */
  private areClothingItemsConnected(positions: ClothingItemPosition[]): boolean {
    if (positions.length < 2) {
      return false; // Need at least 2 items to be connected
    }

    // Create adjacency list to track connections
    const connections = new Map<string, Set<string>>();
    
    // Initialize adjacency list
    positions.forEach(item => {
      connections.set(item.id, new Set());
    });

    // Check all pairs for overlap/touching
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const item1 = positions[i];
        const item2 = positions[j];
        
        if (this.areItemsTouching(item1, item2)) {
          connections.get(item1.id)?.add(item2.id);
          connections.get(item2.id)?.add(item1.id);
        }
      }
    }

    // Use BFS to check if all items are connected in one component
    const visited = new Set<string>();
    const queue: string[] = [positions[0].id];
    visited.add(positions[0].id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const neighbors = connections.get(currentId) || new Set();
      
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    // All items are connected if we visited all of them
    return visited.size === positions.length;
  }

  /**
   * Check if two items are touching (with some tolerance for near-touches)
   */
  private areItemsTouching(item1: ClothingItemPosition, item2: ClothingItemPosition): boolean {
    const tolerance = 10; // Pixels of tolerance for "almost touching"
    
    const item1Right = item1.x + item1.width;
    const item1Bottom = item1.y + item1.height;
    const item2Right = item2.x + item2.width;
    const item2Bottom = item2.y + item2.height;

    // Check for overlap or near-touching (within tolerance)
    const horizontalOverlap = !(item1Right + tolerance < item2.x || item2Right + tolerance < item1.x);
    const verticalOverlap = !(item1Bottom + tolerance < item2.y || item2Bottom + tolerance < item1.y);

    return horizontalOverlap && verticalOverlap;
  }

  /**
   * Get current lil guy state
   */
  getCurrentState(): LilGuyState {
    return this.lilGuyStateSubject.value;
  }

  /**
   * Force lil guy to be alive (for testing or special cases)
   */
  forceAlive(): void {
    this.lilGuyStateSubject.next({
      isAlive: true,
      currentVariation: this.getRandomAliveVariation()
    });
  }

  /**
   * Force lil guy to be dead (for testing or special cases)
   */
  forceDead(): void {
    this.lilGuyStateSubject.next({
      isAlive: false,
      currentVariation: this.getRandomDeadVariation()
    });
  }
} 