import { ClothingItem, ClothingCategory } from './clothing.model';

export interface OutfitId {
  readonly value: string;
}

export interface OutfitItems {
  readonly hat?: ClothingItem;
  readonly shirt?: ClothingItem;
  readonly jacket?: ClothingItem;
  readonly pants?: ClothingItem;
  readonly shoes?: ClothingItem;
  readonly accessories?: ReadonlyArray<ClothingItem>;
}

export interface Outfit {
  readonly id: OutfitId;
  readonly userId: string;
  readonly name: string;
  readonly items: OutfitItems;
  readonly tags: ReadonlyArray<string>;
  readonly occasion?: string;
  readonly season?: Season;
  readonly weather?: WeatherType;
  readonly isFavorite: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter'
}

export enum WeatherType {
  SUNNY = 'sunny',
  RAINY = 'rainy',
  CLOUDY = 'cloudy',
  SNOWY = 'snowy',
  WINDY = 'windy',
  HOT = 'hot',
  COLD = 'cold'
}

export interface CreateOutfitData {
  readonly name: string;
  readonly items: OutfitItems;
  readonly tags?: ReadonlyArray<string>;
  readonly occasion?: string;
  readonly season?: Season;
  readonly weather?: WeatherType;
  readonly isFavorite?: boolean;
}

export interface UpdateOutfitData {
  readonly name?: string;
  readonly items?: OutfitItems;
  readonly tags?: ReadonlyArray<string>;
  readonly occasion?: string;
  readonly season?: Season;
  readonly weather?: WeatherType;
  readonly isFavorite?: boolean;
}

export class OutfitEntity implements Outfit {
  readonly id: OutfitId;
  readonly userId: string;
  readonly name: string;
  readonly items: OutfitItems;
  readonly tags: ReadonlyArray<string>;
  readonly occasion?: string;
  readonly season?: Season;
  readonly weather?: WeatherType;
  readonly isFavorite: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: Outfit) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.items = { ...data.items };
    this.tags = [...data.tags];
    this.occasion = data.occasion;
    this.season = data.season;
    this.weather = data.weather;
    this.isFavorite = data.isFavorite;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  static create(id: string, userId: string, data: CreateOutfitData): OutfitEntity {
    const now = new Date();
    return new OutfitEntity({
      id: { value: id },
      userId,
      name: data.name,
      items: data.items,
      tags: data.tags || [],
      occasion: data.occasion,
      season: data.season,
      weather: data.weather,
      isFavorite: data.isFavorite || false,
      createdAt: now,
      updatedAt: now
    });
  }

  update(data: UpdateOutfitData): OutfitEntity {
    return new OutfitEntity({
      ...this,
      name: data.name ?? this.name,
      items: data.items ?? this.items,
      tags: data.tags ?? this.tags,
      occasion: data.occasion ?? this.occasion,
      season: data.season ?? this.season,
      weather: data.weather ?? this.weather,
      isFavorite: data.isFavorite ?? this.isFavorite,
      updatedAt: new Date()
    });
  }

  toggleFavorite(): OutfitEntity {
    return this.update({ isFavorite: !this.isFavorite });
  }

  addItem(category: ClothingCategory, item: ClothingItem): OutfitEntity {
    const newItems = { ...this.items };
    
    switch (category) {
      case ClothingCategory.HAT:
        newItems.hat = item;
        break;
      case ClothingCategory.SHIRT:
      case ClothingCategory.SWEATER:
      case ClothingCategory.HOODIE:
        newItems.shirt = item;
        break;
      case ClothingCategory.JACKET:
      case ClothingCategory.OUTERWEAR:
        newItems.jacket = item;
        break;
      case ClothingCategory.PANTS:
      case ClothingCategory.SKIRT:
        newItems.pants = item;
        break;
      case ClothingCategory.SHOES:
      case ClothingCategory.BOOTS:
      case ClothingCategory.SNEAKERS:
        newItems.shoes = item;
        break;
      case ClothingCategory.ACCESSORIES:
        newItems.accessories = [...(this.items.accessories || []), item];
        break;
    }

    return this.update({ items: newItems });
  }

  removeItem(category: ClothingCategory, itemId?: string): OutfitEntity {
    const newItems = { ...this.items };
    
    switch (category) {
      case ClothingCategory.HAT:
        newItems.hat = undefined;
        break;
      case ClothingCategory.SHIRT:
      case ClothingCategory.SWEATER:
      case ClothingCategory.HOODIE:
        newItems.shirt = undefined;
        break;
      case ClothingCategory.JACKET:
      case ClothingCategory.OUTERWEAR:
        newItems.jacket = undefined;
        break;
      case ClothingCategory.PANTS:
      case ClothingCategory.SKIRT:
        newItems.pants = undefined;
        break;
      case ClothingCategory.SHOES:
      case ClothingCategory.BOOTS:
      case ClothingCategory.SNEAKERS:
        newItems.shoes = undefined;
        break;
      case ClothingCategory.ACCESSORIES:
        if (itemId && this.items.accessories) {
          newItems.accessories = this.items.accessories.filter(
            item => item.id.value !== itemId
          );
        } else {
          newItems.accessories = [];
        }
        break;
    }

    return this.update({ items: newItems });
  }

  getAllItems(): ClothingItem[] {
    const items: ClothingItem[] = [];
    
    if (this.items.hat) items.push(this.items.hat);
    if (this.items.shirt) items.push(this.items.shirt);
    if (this.items.jacket) items.push(this.items.jacket);
    if (this.items.pants) items.push(this.items.pants);
    if (this.items.shoes) items.push(this.items.shoes);
    if (this.items.accessories) items.push(...this.items.accessories);
    
    return items;
  }

  hasItem(itemId: string): boolean {
    return this.getAllItems().some(item => item.id.value === itemId);
  }

  isComplete(): boolean {
    // At minimum, an outfit should have a shirt and pants (or equivalent)
    return !!(this.items.shirt && this.items.pants);
  }

  getItemCount(): number {
    return this.getAllItems().length;
  }
} 