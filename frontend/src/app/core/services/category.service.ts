import { Injectable } from '@angular/core';
import { ClothingCategory } from '../../shared/models/clothing.models';

export interface CategoryGroup {
  name: string;
  icon: string;
  categories: CategoryInfo[];
}

export interface CategoryInfo {
  category: ClothingCategory;
  displayName: string;
  icon: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  /**
   * Get simple category groups for outfit generation
   */
  getCategoryGroups(): CategoryGroup[] {
    return [
      {
        name: 'Outfit Essentials',
        icon: 'checkroom',
        categories: [
          { category: ClothingCategory.HAT, displayName: 'Hat', icon: 'ph:beanie', description: 'Hats, caps, beanies' },
          { category: ClothingCategory.TOP, displayName: 'Top', icon: 'tabler:shirt', description: 'Shirts, t-shirts, blouses, sweaters' },
          { category: ClothingCategory.JACKET, displayName: 'Jacket', icon: 'tabler:jacket', description: 'Jackets, blazers, coats' },
          { category: ClothingCategory.JEANS, displayName: 'Jeans', icon: 'ph:pants', description: 'Jeans, pants, bottoms' },
          { category: ClothingCategory.SHOES, displayName: 'Shoes', icon: 'tabler:shoe', description: 'All types of footwear' }
        ]
      }
    ];
  }

  /**
   * Get category info by category enum
   */
  getCategoryInfo(category: ClothingCategory): CategoryInfo | undefined {
    const groups = this.getCategoryGroups();
    for (const group of groups) {
      const categoryInfo = group.categories.find(c => c.category === category);
      if (categoryInfo) {
        return categoryInfo;
      }
    }
    return undefined;
  }

  /**
   * Get all categories as a flat array
   */
  getAllCategories(): CategoryInfo[] {
    return this.getCategoryGroups().flatMap(group => group.categories);
  }

  /**
   * Get categories for a specific group
   */
  getCategoriesInGroup(groupName: string): CategoryInfo[] {
    const group = this.getCategoryGroups().find(g => g.name === groupName);
    return group ? group.categories : [];
  }

  /**
   * Search categories by name
   */
  searchCategories(query: string): CategoryInfo[] {
    const allCategories = this.getAllCategories();
    const lowerQuery = query.toLowerCase();
    
    return allCategories.filter(category => 
      category.displayName.toLowerCase().includes(lowerQuery) ||
      category.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all categories as popular (since we only have 5 simple ones)
   */
  getPopularCategories(): CategoryInfo[] {
    return this.getAllCategories();
  }
} 