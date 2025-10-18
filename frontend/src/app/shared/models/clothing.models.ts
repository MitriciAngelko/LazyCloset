/**
 * @deprecated This file contains legacy models that are being phased out.
 * Please use the domain models from './domain/clothing.model' instead.
 * 
 * Migration guide:
 * - ClothingCategory -> import from './domain/clothing.model'
 * - ClothingItem -> use ClothingItemEntity from './domain/clothing.model'
 * - All other types -> check './domain/clothing.model' for equivalents
 */

export enum ClothingCategory {
  HAT = 'hat',
  TOP = 'top',
  JACKET = 'jacket',
  JEANS = 'jeans',
  SHOES = 'shoes'
}

export enum ClothingSubCategory {
  // Hat subcategories
  BASEBALL_CAP = 'baseball_cap',
  BEANIE = 'beanie',
  FORMAL_HAT = 'formal_hat',
  
  // Top subcategories
  FORMAL_SHIRT = 'formal_shirt',
  CASUAL_SHIRT = 'casual_shirt',
  T_SHIRT = 't_shirt',
  SWEATER = 'sweater',
  BLOUSE = 'blouse',
  TANK_TOP = 'tank_top',
  
  // Jacket subcategories
  BLAZER = 'blazer',
  CASUAL_JACKET = 'casual_jacket',
  WINTER_COAT = 'winter_coat',
  CARDIGAN = 'cardigan',
  HOODIE = 'hoodie',
  
  // Jeans/Pants subcategories
  FORMAL_PANTS = 'formal_pants',
  CASUAL_PANTS = 'casual_pants',
  JEANS_SKINNY = 'jeans_skinny',
  JEANS_REGULAR = 'jeans_regular',
  SHORTS = 'shorts',
  LEGGINGS = 'leggings',
  
  // Shoes subcategories
  FORMAL_SHOES = 'formal_shoes',
  CASUAL_SHOES = 'casual_shoes',
  SNEAKERS = 'sneakers',
  BOOTS = 'boots',
  SANDALS = 'sandals',
  HEELS = 'heels'
}

export enum ClothingOccasion {
  CASUAL = 'casual',
  FORMAL = 'formal',
  BUSINESS = 'business',
  PARTY = 'party',
  SPORT = 'sport',
  BEACH = 'beach',
  WINTER = 'winter',
  SUMMER = 'summer'
}

export enum ClothingColor {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  BROWN = 'brown',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  ORANGE = 'orange',
  PINK = 'pink',
  NAVY = 'navy',
  BEIGE = 'beige'
}

export interface ClothingItem {
  id: string;
  userId: string;
  category: ClothingCategory;
  subCategory?: ClothingSubCategory;
  occasions?: ClothingOccasion[];
  imageUrl: string;
  thumbnailUrl: string;
  originalFileName: string;
  colors: ClothingColor[];
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutfitItems {
  hat?: ClothingItem;
  shirt: ClothingItem;
  jacket?: ClothingItem;
  pants: ClothingItem;
  shoes: ClothingItem;
}

export interface Outfit {
  id: string;
  userId: string;
  items: OutfitItems;
  name?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface UploadResult {
  success: boolean;
  item?: ClothingItem;
  error?: string;
}

export interface OutfitGenerationOptions {
  includeJacket: boolean;
  includeHat: boolean;
  colorPreference?: ClothingColor[];
  excludeItems?: string[]; // item IDs to exclude
} 