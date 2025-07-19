export enum ClothingCategory {
  SHIRT = 'shirt',
  PANTS = 'pants',
  DRESS = 'dress',
  SKIRT = 'skirt',
  JACKET = 'jacket',
  SWEATER = 'sweater',
  HOODIE = 'hoodie',
  SHOES = 'shoes',
  BOOTS = 'boots',
  SNEAKERS = 'sneakers',
  ACCESSORIES = 'accessories',
  UNDERWEAR = 'underwear',
  SLEEPWEAR = 'sleepwear',
  ACTIVEWEAR = 'activewear',
  OUTERWEAR = 'outerwear',
  SWIMWEAR = 'swimwear',
  HAT = 'hat'
}

export enum ClothingColor {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  PURPLE = 'purple',
  PINK = 'pink',
  BROWN = 'brown',
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  GREY = 'grey',
  NAVY = 'navy',
  BEIGE = 'beige',
  CREAM = 'cream',
  MAROON = 'maroon',
  TEAL = 'teal',
  GOLD = 'gold',
  SILVER = 'silver',
  MULTICOLOR = 'multicolor'
}

export enum ClothingSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl',
  XXXL = 'xxxl'
}

export interface ClothingItemId {
  readonly value: string;
}

export interface ClothingItem {
  readonly id: ClothingItemId;
  readonly userId: string;
  readonly category: ClothingCategory;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly originalFileName: string;
  readonly colors: ReadonlyArray<ClothingColor>;
  readonly tags: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateClothingItemData {
  readonly category: ClothingCategory;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly originalFileName: string;
  readonly colors: ReadonlyArray<ClothingColor>;
  readonly tags: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite?: boolean;
}

export interface UpdateClothingItemData {
  readonly category?: ClothingCategory;
  readonly colors?: ReadonlyArray<ClothingColor>;
  readonly tags?: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite?: boolean;
}

export class ClothingItemEntity implements ClothingItem {
  readonly id: ClothingItemId;
  readonly userId: string;
  readonly category: ClothingCategory;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly originalFileName: string;
  readonly colors: ReadonlyArray<ClothingColor>;
  readonly tags: ReadonlyArray<string>;
  readonly size?: ClothingSize;
  readonly brand?: string;
  readonly isFavorite: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: ClothingItem) {
    this.id = data.id;
    this.userId = data.userId;
    this.category = data.category;
    this.imageUrl = data.imageUrl;
    this.thumbnailUrl = data.thumbnailUrl;
    this.originalFileName = data.originalFileName;
    this.colors = [...data.colors];
    this.tags = [...data.tags];
    this.size = data.size;
    this.brand = data.brand;
    this.isFavorite = data.isFavorite;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  static create(id: string, userId: string, data: CreateClothingItemData): ClothingItemEntity {
    const now = new Date();
    return new ClothingItemEntity({
      id: { value: id },
      userId,
      category: data.category,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl,
      originalFileName: data.originalFileName,
      colors: data.colors,
      tags: data.tags,
      size: data.size,
      brand: data.brand,
      isFavorite: data.isFavorite ?? false,
      createdAt: now,
      updatedAt: now
    });
  }

  update(data: UpdateClothingItemData): ClothingItemEntity {
    return new ClothingItemEntity({
      ...this,
      category: data.category ?? this.category,
      colors: data.colors ?? this.colors,
      tags: data.tags ?? this.tags,
      size: data.size ?? this.size,
      brand: data.brand ?? this.brand,
      isFavorite: data.isFavorite ?? this.isFavorite,
      updatedAt: new Date()
    });
  }

  toggleFavorite(): ClothingItemEntity {
    return this.update({ isFavorite: !this.isFavorite });
  }

  hasColor(color: ClothingColor): boolean {
    return this.colors.includes(color);
  }

  hasTag(tag: string): boolean {
    return this.tags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  addTag(tag: string): ClothingItemEntity {
    if (this.hasTag(tag)) {
      return this;
    }
    return this.update({ tags: [...this.tags, tag.toLowerCase().trim()] });
  }

  removeTag(tag: string): ClothingItemEntity {
    const filteredTags = this.tags.filter(t => t.toLowerCase() !== tag.toLowerCase());
    return this.update({ tags: filteredTags });
  }
} 