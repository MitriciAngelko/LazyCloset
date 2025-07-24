import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClothingItem, ClothingCategory, ClothingColor } from '../../../shared/models/clothing.models';
import { ClothingService } from '../../../core/services/clothing.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-item-edit-modal',
  standalone: false,
  templateUrl: './item-edit-modal.component.html',
  styleUrls: ['./item-edit-modal.component.scss']
})
export class ItemEditModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  editForm: FormGroup;
  isLoading = false;
  
  readonly categories = Object.values(ClothingCategory);
  readonly colors = Object.values(ClothingColor);
  allCategories: any[] = [];
  
  constructor(
    private fb: FormBuilder,
    private clothingService: ClothingService,
    public categoryService: CategoryService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ItemEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: ClothingItem }
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.allCategories = this.categoryService.getAllCategories();
    this.populateForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      colors: [[], Validators.required],
      tags: [[]],
      isFavorite: [false]
    });
  }

  private populateForm(): void {
    const item = this.data.item;
    this.editForm.patchValue({
      category: item.category,
      colors: item.colors || [],
      tags: item.tags || [],
      isFavorite: item.isFavorite
    });
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.editForm.value;
    
    // Filter out empty tags
    const cleanedTags = formValue.tags.filter((tag: string) => tag.trim() !== '');
    
    const updateData = {
      id: this.data.item.id,
      category: formValue.category,
      colors: formValue.colors,
      tags: cleanedTags,
      isFavorite: formValue.isFavorite
    };

    this.clothingService.updateClothingItem(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedItem) => {
          this.isLoading = false;
          if (updatedItem) {
            this.snackBar.open('Item updated successfully', 'Close', {
              duration: 3000
            });
            this.dialogRef.close(updatedItem);
          } else {
            this.snackBar.open('Failed to update item', 'Close', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Failed to update item:', error);
          this.snackBar.open('Failed to update item', 'Close', {
            duration: 3000
          });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getCategoryDisplayName(category: ClothingCategory): string {
    const categoryInfo = this.categoryService.getCategoryInfo(category);
    return categoryInfo?.displayName || category;
  }



  getColorDisplayName(color: ClothingColor): string {
    const displayNames: { [key in ClothingColor]: string } = {
      [ClothingColor.RED]: 'Red',
      [ClothingColor.BLUE]: 'Blue',
      [ClothingColor.GREEN]: 'Green',
      [ClothingColor.BLACK]: 'Black',
      [ClothingColor.WHITE]: 'White',
      [ClothingColor.GRAY]: 'Gray',
      [ClothingColor.BROWN]: 'Brown',
      [ClothingColor.YELLOW]: 'Yellow',
      [ClothingColor.PURPLE]: 'Purple',
      [ClothingColor.ORANGE]: 'Orange',
      [ClothingColor.PINK]: 'Pink',
      [ClothingColor.NAVY]: 'Navy',
      [ClothingColor.BEIGE]: 'Beige'
    };
    return displayNames[color] || color;
  }

  getColorHex(color: ClothingColor): string {
    const colorHexMap: { [key in ClothingColor]: string } = {
      [ClothingColor.RED]: '#f44336',
      [ClothingColor.BLUE]: '#2196f3',
      [ClothingColor.GREEN]: '#4caf50',
      [ClothingColor.BLACK]: '#424242',
      [ClothingColor.WHITE]: '#fafafa',
      [ClothingColor.GRAY]: '#9e9e9e',
      [ClothingColor.BROWN]: '#795548',
      [ClothingColor.YELLOW]: '#ffeb3b',
      [ClothingColor.PURPLE]: '#9c27b0',
      [ClothingColor.ORANGE]: '#ff9800',
      [ClothingColor.PINK]: '#e91e63',
      [ClothingColor.NAVY]: '#1a237e',
      [ClothingColor.BEIGE]: '#f5f5dc'
    };
    return colorHexMap[color] || '#9e9e9e';
  }

  addTag(event: any): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      const currentTags = this.editForm.get('tags')?.value || [];
      const newTag = value.trim();
      
      if (!currentTags.includes(newTag)) {
        this.editForm.get('tags')?.setValue([...currentTags, newTag]);
      }
    }

    if (input) {
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const currentTags = this.editForm.get('tags')?.value || [];
    const index = currentTags.indexOf(tag);
    
    if (index >= 0) {
      currentTags.splice(index, 1);
      this.editForm.get('tags')?.setValue([...currentTags]);
    }
  }

  toggleColor(color: ClothingColor): void {
    const currentColors = this.editForm.get('colors')?.value || [];
    const index = currentColors.indexOf(color);
    
    if (index >= 0) {
      currentColors.splice(index, 1);
    } else {
      currentColors.push(color);
    }
    
    this.editForm.get('colors')?.setValue([...currentColors]);
  }

  toggleFavorite(): void {
    const currentValue = this.editForm.get('isFavorite')?.value;
    this.editForm.get('isFavorite')?.setValue(!currentValue);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });
  }
} 