export enum ClothingCategory {
  HAT = 'hat',
  SHIRT = 'shirt',
  JACKET = 'jacket',
  PANTS = 'pants',
  SHOES = 'shoes'
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