import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClothingService } from '../../../core/services/clothing.service';
import { ClothingCategory, ClothingColor } from '../../../shared/models/clothing.models';

// Use the same interface as ClothingService
interface ClothingUploadResult {
  success: boolean;
  item?: any;
  error?: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: false,
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedCategory: ClothingCategory = ClothingCategory.SHIRT;
  selectedColors: ClothingColor[] = [];
  customTags: string = '';
  isDragOver = false;
  isUploading = false;
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  readonly categories = Object.values(ClothingCategory);
  readonly colors = Object.values(ClothingColor);

  constructor(
    private clothingService: ClothingService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  }

  /**
   * Handle file input change
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelect(input.files[0]);
    }
  }

  /**
   * Open file picker
   */
  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection
   */
  private handleFileSelect(file: File): void {
    // Validate file type
    if (!this.isValidImageFile(file)) {
      this.snackBar.open('Please select a valid image file (JPEG, PNG, WebP)', 'Close', {
        duration: 3000
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('File size must be less than 10MB', 'Close', {
        duration: 3000
      });
      return;
    }

    this.selectedFile = file;
    this.createPreview(file);
  }

  /**
   * Create image preview
   */
  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Upload the selected image
   */
  uploadImage(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select an image first', 'Close', {
        duration: 3000
      });
      return;
    }

    this.isUploading = true;
    
    const tags = this.customTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.clothingService.uploadClothingItem(
      this.selectedFile,
      this.selectedCategory,
      this.selectedColors,
      tags
    ).subscribe({
      next: (result: ClothingUploadResult) => {
        this.isUploading = false;
        if (result.success) {
          this.snackBar.open('Image uploaded successfully!', 'Close', {
            duration: 3000
          });
          this.resetForm();
        } else {
          this.snackBar.open(`Upload failed: ${result.error}`, 'Close', {
            duration: 5000
          });
        }
      },
      error: (error: any) => {
        this.isUploading = false;
        this.snackBar.open(`Upload failed: ${error.message}`, 'Close', {
          duration: 5000
        });
      }
    });
  }

  /**
   * Toggle color selection
   */
  toggleColor(color: ClothingColor): void {
    const index = this.selectedColors.indexOf(color);
    if (index > -1) {
      this.selectedColors.splice(index, 1);
    } else {
      this.selectedColors.push(color);
    }
  }

  /**
   * Check if color is selected
   */
  isColorSelected(color: ClothingColor): boolean {
    return this.selectedColors.includes(color);
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.selectedColors = [];
    this.customTags = '';
    this.fileInput.nativeElement.value = '';
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    this.resetForm();
  }

  /**
   * Validate if file is a valid image
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: ClothingCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get color display name
   */
  getColorDisplayName(color: ClothingColor): string {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }
}
