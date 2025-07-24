import { Component, ElementRef, ViewChild, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClothingService } from '../../../core/services/clothing.service';
import { CategoryService, CategoryGroup, CategoryInfo } from '../../../core/services/category.service';
import { ColorDetectionService, ColorPalette } from '../../../core/services/color-detection.service';
import { BackgroundRemovalService, BackgroundRemovalResult } from '../../../core/services/background-removal.service';
import { ClothingCategory, ClothingColor } from '../../../shared/models/clothing.models';

// Use the same interface as ClothingService
interface ClothingUploadResult {
  success: boolean;
  item?: any;
  error?: string;
}

@Component({
  selector: 'app-upload-modal',
  standalone: false,
  templateUrl: './upload-modal.component.html',
  styleUrl: './upload-modal.component.scss'
})
export class UploadModalComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedCategory: ClothingCategory = ClothingCategory.TOP;
  selectedColors: ClothingColor[] = [];
  customTags: string = '';
  isDragOver = false;
  isUploading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  // Phase 2 properties
  processedFile: File | null = null;
  suggestedColors: ClothingColor[] = [];
  colorPalette: ColorPalette | null = null;
  backgroundRemovalResult: BackgroundRemovalResult | null = null;
  isProcessingBackground = false;
  showBackgroundOptions = false;

  readonly colors = Object.values(ClothingColor);
  
  allCategories: CategoryInfo[] = [];
  categoryGroups: CategoryGroup[] = [];

  constructor(
    public dialogRef: MatDialogRef<UploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private clothingService: ClothingService,
    private categoryService: CategoryService,
    private colorDetectionService: ColorDetectionService,
    private backgroundRemovalService: BackgroundRemovalService
  ) {
    this.loadCategories();
  }

  /**
   * Load categories
   */
  private loadCategories(): void {
    this.allCategories = this.categoryService.getAllCategories();
    this.categoryGroups = this.categoryService.getCategoryGroups();
  }

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
   * Handle drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  /**
   * Open file picker
   */
  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFileSelection(target.files[0]);
    }
  }

  /**
   * Process selected file
   */
  private handleFileSelection(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file', 'Close', {
        duration: 3000
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.snackBar.open('File size must be less than 10MB', 'Close', {
        duration: 3000
      });
      return;
    }

    this.selectedFile = file;
    this.processedFile = file; // Initially, processed file is the same as selected
    this.createPreview(file);

    // Start Phase 2 processing - background removal first, then color analysis
    this.processBackgroundRemoval(file);
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
    const fileToUpload = this.processedFile || this.selectedFile;
    
    if (!fileToUpload) {
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

    // Use selected colors (which include auto-detected ones)
    const colorsToUse = this.selectedColors;

    this.clothingService.uploadClothingItem(
      fileToUpload,
      this.selectedCategory,
      colorsToUse,
      tags
    ).subscribe({
      next: (result: ClothingUploadResult) => {
        this.isUploading = false;
        if (result.success) {
          this.snackBar.open('Image uploaded successfully!', 'Close', {
            duration: 3000
          });
          this.dialogRef.close(result); // Close modal with result
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
   * Remove selected image
   */
  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.selectedColors = [];
    this.customTags = '';
    this.fileInput.nativeElement.value = '';
    this.processedFile = null;
    this.backgroundRemovalResult = null;
    this.showBackgroundOptions = false;
  }

  /**
   * Get color display name
   */
  getColorDisplayName(color: ClothingColor): string {
    return this.colorDetectionService.getColorDisplayName(color);
  }

  /**
   * Close modal
   */
  cancel(): void {
    this.dialogRef.close();
  }

  // ===== PHASE 2: Smart Features =====

  /**
   * Analyze image colors automatically
   */
  private async analyzeImageColors(file: File): Promise<void> {
    try {
      const palette = await this.colorDetectionService.analyzeImageColors(file);
      this.colorPalette = palette;
      
      // Auto-apply only the dominant color
      if (palette.dominantColor) {
        this.selectedColors = [palette.dominantColor.color];
      }

    } catch (error) {
      console.error('Color analysis failed:', error);
    }
  }

  /**
   * Process background removal for the image
   */
  private async processBackgroundRemoval(file: File): Promise<void> {
    this.isProcessingBackground = true;
    this.showBackgroundOptions = true;

    try {
      const result = await this.backgroundRemovalService.removeBackground(file);
      this.backgroundRemovalResult = result;

      if (result.success && result.method === 'api' && result.processedFile) {
        // Auto-apply the background-removed image
        this.processedFile = result.processedFile;
        this.createPreview(result.processedFile);
        
        // Now analyze colors on the background-removed image
        await this.analyzeImageColors(result.processedFile);
        
        this.snackBar.open('Background removed and colors analyzed!', 'Close', {
          duration: 3000
        });
      } else if (result.method === 'fallback') {
        console.log('Background removal API not available, manual options shown');
        // Don't run color analysis automatically in fallback mode
      }

    } catch (error) {
      console.error('Background removal failed:', error);
      this.showBackgroundOptions = false;
      // Don't run color analysis automatically on error
    } finally {
      this.isProcessingBackground = false;
    }
  }

  /**
   * Use background-removed image
   */
  async useBackgroundRemovedImage(): Promise<void> {
    if (this.backgroundRemovalResult?.processedFile) {
      this.processedFile = this.backgroundRemovalResult.processedFile;
      this.createPreview(this.processedFile);
      
      // Analyze colors on the background-removed image
      await this.analyzeImageColors(this.processedFile);
      
      this.snackBar.open('Using background-removed image and analyzing colors', 'Close', {
        duration: 2000
      });
    }
  }

  /**
   * Use original image (reject background removal)
   */
  async useOriginalImage(): Promise<void> {
    if (this.selectedFile) {
      this.processedFile = this.selectedFile;
      this.createPreview(this.selectedFile);
      
      // Analyze colors on the original image
      await this.analyzeImageColors(this.selectedFile);
      
      this.snackBar.open('Using original image and analyzing colors', 'Close', {
        duration: 2000
      });
    }
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(category: ClothingCategory): boolean {
    return this.selectedCategory === category;
  }

  /**
   * Select category
   */
  selectCategory(category: ClothingCategory): void {
    this.selectedCategory = category;
  }

  /**
   * Check if background removal API is available
   */
  isBackgroundRemovalApiAvailable(): boolean {
    return this.backgroundRemovalService.isApiAvailable();
  }

  /**
   * Manually trigger color analysis on current image
   */
  async analyzeColorsManually(): Promise<void> {
    const fileToAnalyze = this.processedFile || this.selectedFile;
    if (fileToAnalyze) {
      await this.analyzeImageColors(fileToAnalyze);
      this.snackBar.open('Color analysis complete!', 'Close', {
        duration: 2000
      });
    }
  }
} 