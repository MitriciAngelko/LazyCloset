import { Injectable } from '@angular/core';

export interface BackgroundRemovalResult {
  success: boolean;
  processedImageUrl?: string;
  processedFile?: File;
  originalFile: File;
  method: 'api' | 'manual' | 'fallback';
  error?: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundRemovalService {

  // Get your API key from https://www.remove.bg (50 free calls/month)
  private readonly REMOVE_BG_API_KEY = 'boU8rxDjMGtMNSxMHT4HeTxX';
  private readonly REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

  /**
   * Attempt to remove background using remove.bg API
   */
  async removeBackground(file: File): Promise<BackgroundRemovalResult> {
    // If no API key is configured, fall back to manual processing
    if (!this.REMOVE_BG_API_KEY) {
      console.warn('Remove.bg API key not configured, falling back to manual processing');
      return this.fallbackProcessing(file);
    }

    try {
      // Validate file before sending
      if (file.size > 12 * 1024 * 1024) { // 12MB limit
        throw new Error('Image too large. Maximum size is 12MB.');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Unsupported image format. Use JPEG, PNG, or WebP.');
      }

      const formData = new FormData();
      formData.append('image_file', file);
      formData.append('size', 'auto');
      formData.append('format', 'png'); // Ensure PNG output for transparency

      const response = await fetch(this.REMOVE_BG_API_URL, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.REMOVE_BG_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Remove.bg API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const processedFile = new File([blob], `bg-removed-${file.name}`, {
        type: 'image/png', // Remove.bg returns PNG
        lastModified: Date.now(),
      });

      const processedImageUrl = URL.createObjectURL(blob);

      return {
        success: true,
        processedImageUrl,
        processedFile,
        originalFile: file,
        method: 'api'
      };

    } catch (error: any) {
      console.error('Background removal failed:', error);
      // Fall back to manual processing
      return this.fallbackProcessing(file);
    }
  }

  /**
   * Fallback processing when API fails
   */
  private async fallbackProcessing(file: File): Promise<BackgroundRemovalResult> {
    try {
      // For now, return the original file with a flag indicating manual processing is needed
      const imageUrl = URL.createObjectURL(file);
      
      return {
        success: true,
        processedImageUrl: imageUrl,
        processedFile: file,
        originalFile: file,
        method: 'fallback',
        error: 'Background removal API unavailable - manual cropping recommended'
      };
    } catch (error: any) {
      return {
        success: false,
        originalFile: file,
        method: 'fallback',
        error: error.message
      };
    }
  }

  /**
   * Manual cropping using canvas
   */
  async cropImage(file: File, cropArea: CropArea): Promise<BackgroundRemovalResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          success: false,
          originalFile: file,
          method: 'manual',
          error: 'Canvas context not available'
        });
        return;
      }

      img.onload = () => {
        try {
          // Set canvas size to crop area
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;

          // Draw cropped image
          ctx.drawImage(
            img,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
            0, 0, cropArea.width, cropArea.height // Destination rectangle
          );

          // Convert to blob and file
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({
                success: false,
                originalFile: file,
                method: 'manual',
                error: 'Failed to create cropped image'
              });
              return;
            }

            const croppedFile = new File([blob], `cropped-${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            });

            const processedImageUrl = URL.createObjectURL(blob);

            resolve({
              success: true,
              processedImageUrl,
              processedFile: croppedFile,
              originalFile: file,
              method: 'manual'
            });
          }, file.type, 0.9);

        } catch (error: any) {
          resolve({
            success: false,
            originalFile: file,
            method: 'manual',
            error: error.message
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          originalFile: file,
          method: 'manual',
          error: 'Failed to load image for cropping'
        });
      };

      // Load image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Apply brightness/contrast adjustments to improve image quality
   */
  async enhanceImage(file: File, brightness: number = 1.0, contrast: number = 1.0): Promise<BackgroundRemovalResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({
          success: false,
          originalFile: file,
          method: 'fallback',
          error: 'Canvas context not available'
        });
        return;
      }

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Apply filters
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Apply brightness and contrast to RGB channels
            for (let j = 0; j < 3; j++) {
              let value = data[i + j];
              // Apply contrast first, then brightness
              value = ((value - 128) * contrast) + 128;
              value = value * brightness;
              data[i + j] = Math.max(0, Math.min(255, value));
            }
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({
                success: false,
                originalFile: file,
                method: 'fallback',
                error: 'Failed to enhance image'
              });
              return;
            }

            const enhancedFile = new File([blob], `enhanced-${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            });

            const processedImageUrl = URL.createObjectURL(blob);

            resolve({
              success: true,
              processedImageUrl,
              processedFile: enhancedFile,
              originalFile: file,
              method: 'manual'
            });
          }, file.type, 0.9);

        } catch (error: any) {
          resolve({
            success: false,
            originalFile: file,
            method: 'fallback',
            error: error.message
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          originalFile: file,
          method: 'fallback',
          error: 'Failed to load image for enhancement'
        });
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if remove.bg API is available
   */
  isApiAvailable(): boolean {
    return !!this.REMOVE_BG_API_KEY;
  }

  /**
   * Get API usage info (placeholder for future implementation)
   */
  async getApiUsage(): Promise<{ remaining: number; total: number } | null> {
    if (!this.REMOVE_BG_API_KEY) return null;

    try {
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        headers: {
          'X-Api-Key': this.REMOVE_BG_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          remaining: data.attributes.api.free_calls_limit - data.attributes.api.free_calls,
          total: data.attributes.api.free_calls_limit
        };
      }
    } catch (error) {
      console.error('Failed to get API usage:', error);
    }

    return null;
  }
} 