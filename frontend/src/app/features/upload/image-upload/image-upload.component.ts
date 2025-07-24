import { Component, ElementRef, ViewChild } from '@angular/core';
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
  selector: 'app-image-upload',
  standalone: false,
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedCategory: ClothingCategory = ClothingCategory.TOP;
  selectedColors: ClothingColor[] = [];
  customTags: string = '';
  isDragOver = false;
  isUploading = false;
  isAnalyzing = false;
  isProcessingBackground = false;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  processedFile: File | null = null;
  
  // Color analysis results
  colorPalette: ColorPalette | null = null;
  suggestedColors: ClothingColor[] = [];
  
  // Background removal results
  backgroundRemovalResult: BackgroundRemovalResult | null = null;
  showBackgroundOptions = false;
  
  // Category selection - simplified
  allCategories: CategoryInfo[] = [];

  readonly colors = Object.values(ClothingColor);

  constructor(
    private clothingService: ClothingService,
    private categoryService: CategoryService,
    private colorDetectionService: ColorDetectionService,
    private backgroundRemovalService: BackgroundRemovalService,
    private snackBar: MatSnackBar
  ) {
    this.initializeCategories();
  }

  /**
   * Initialize category data
   */
  private initializeCategories(): void {
    this.allCategories = this.categoryService.getAllCategories();
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
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file', 'Close', {
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
   * Get color display name
   */
  getColorDisplayName(color: ClothingColor): string {
    return this.colorDetectionService.getColorDisplayName(color);
  }

  // ===== PHASE 2: Smart Features =====

  /**
   * Analyze image colors automatically
   */
  private async analyzeImageColors(file: File): Promise<void> {
    this.isAnalyzing = true;

    try {
      const palette = await this.colorDetectionService.analyzeImageColors(file);
      this.colorPalette = palette;
      this.suggestedColors = this.colorDetectionService.suggestColors(palette);
      
      // Auto-apply the dominant color
      this.selectedColors = [palette.dominantColor.color];
      
      // Auto-suggest category based on colors (basic heuristic)
      this.suggestCategory(palette);
      
      console.log('🎨 Color analysis complete:', {
        dominantColor: palette.dominantColor.color,
        dominantColorPercentage: palette.dominantColor.percentage,
        suggestedColors: this.suggestedColors,
        appliedColors: this.selectedColors,
        totalColors: palette.colors.length
      });

    } catch (error) {
      console.error('Color analysis failed:', error);
      this.suggestedColors = [];
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze image colors from URL (for background-removed images)
   */
  private async analyzeImageColorsFromUrl(imageUrl: string): Promise<void> {
    this.isAnalyzing = true;

    try {
      const palette = await this.colorDetectionService.analyzeImageColorsFromUrl(imageUrl);
      this.colorPalette = palette;
      this.suggestedColors = this.colorDetectionService.suggestColors(palette);
      
      // Auto-apply the dominant color
      this.selectedColors = [palette.dominantColor.color];
      
      // Auto-suggest category based on colors (basic heuristic)
      this.suggestCategory(palette);
      
      console.log('🎨 Color analysis from URL complete:', {
        dominantColor: palette.dominantColor.color,
        dominantColorPercentage: palette.dominantColor.percentage,
        suggestedColors: this.suggestedColors,
        appliedColors: this.selectedColors,
        totalColors: palette.colors.length
      });

    } catch (error) {
      console.error('Color analysis from URL failed:', error);
      this.suggestedColors = [];
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Process background removal
   */
  private async processBackgroundRemoval(file: File): Promise<void> {
    console.log('🔄 Starting background removal process...');
    this.isProcessingBackground = true;
    this.showBackgroundOptions = true;

    try {
      const result = await this.backgroundRemovalService.removeBackground(file);
      this.backgroundRemovalResult = result;
      console.log('📋 Background removal result:', result);

      if (result.success && result.method === 'api' && result.processedFile) {
        console.log('✅ Background removal successful via API');
        // Auto-apply the background-removed image
        this.processedFile = result.processedFile;
        this.createPreview(result.processedFile);
        
        // Now analyze colors on the background-removed image
        console.log('🎨 Starting color analysis on background-removed image...');
        if (result.processedImageUrl) {
          await this.analyzeImageColorsFromUrl(result.processedImageUrl);
        } else {
          await this.analyzeImageColors(result.processedFile);
        }
        
        this.snackBar.open('Background removed and colors analyzed!', 'Close', {
          duration: 3000
        });
      } else if (result.method === 'fallback') {
        console.log('⚠️ Background removal API not available, manual options shown');
        // Don't run color analysis automatically in fallback mode
        // User will need to manually choose which image to use
      }

    } catch (error) {
      console.error('❌ Background removal failed:', error);
      this.showBackgroundOptions = false;
      // Don't run color analysis automatically on error
      // User will need to manually choose which image to use
    } finally {
      this.isProcessingBackground = false;
      console.log('🏁 Background removal process completed');
    }
  }

  /**
   * Suggest category based on color analysis
   */
  private suggestCategory(palette: ColorPalette): void {
    const dominantColor = palette.dominantColor.color;
    
    // Basic category suggestion logic based on colors
    // This is a simple heuristic - in a real app you might use ML
    if (dominantColor === ClothingColor.BROWN || dominantColor === ClothingColor.BEIGE) {
      // Brown/beige items are often shoes or pants
      if (palette.colors.some(c => c.color === ClothingColor.BLACK)) {
        this.selectedCategory = ClothingCategory.SHOES;
      } else {
                 this.selectedCategory = ClothingCategory.JEANS;
      }
    } else if (dominantColor === ClothingColor.BLACK && palette.colors.length <= 2) {
      // Solid black items are often jackets or shoes
      this.selectedCategory = ClothingCategory.JACKET;
    }
    // Keep the default TOP category for most other cases
  }

  /**
   * Apply auto-detected colors to selection
   */
  applyAutoDetectedColors(): void {
    this.selectedColors = [...this.suggestedColors];
    this.snackBar.open(`Applied ${this.suggestedColors.length} detected colors`, 'Close', {
      duration: 2000
    });
  }

  /**
   * Use background-removed image
   */
  async useBackgroundRemovedImage(): Promise<void> {
    if (this.backgroundRemovalResult?.processedFile) {
      this.processedFile = this.backgroundRemovalResult.processedFile;
      this.createPreview(this.processedFile);
      
      // Re-analyze colors on the background-removed image
      if (this.backgroundRemovalResult.processedImageUrl) {
        await this.analyzeImageColorsFromUrl(this.backgroundRemovalResult.processedImageUrl);
      } else {
        await this.analyzeImageColors(this.processedFile);
      }
      
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

  /**
   * Check if background removal API is available
   */
  isBackgroundRemovalApiAvailable(): boolean {
    return this.backgroundRemovalService.isApiAvailable();
  }

  /**
   * Get color hex for palette display
   */
  getColorHex(color: ClothingColor): string {
    if (!this.colorPalette) return '';
    
    const colorInfo = this.colorPalette.colors.find(c => c.color === color);
    return colorInfo?.hex || '';
  }

  /**
   * Get color percentage for palette display
   */
  getColorPercentage(color: ClothingColor): number {
    if (!this.colorPalette) return 0;
    
    const colorInfo = this.colorPalette.colors.find(c => c.color === color);
    return Math.round(colorInfo?.percentage || 0);
  }

  // ===== Original Helper Methods =====

  /**
   * Select a category
   */
  selectCategory(category: ClothingCategory): void {
    this.selectedCategory = category;
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(category: ClothingCategory): boolean {
    return this.selectedCategory === category;
  }
}
