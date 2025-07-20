import { Injectable } from '@angular/core';
import { ClothingColor } from '../../shared/models/clothing.models';

export interface ColorInfo {
  color: ClothingColor;
  percentage: number;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export interface ColorPalette {
  dominantColor: ColorInfo;
  colors: ColorInfo[];
  totalAnalyzed: number;
}

@Injectable({
  providedIn: 'root'
})
export class ColorDetectionService {

  // Color mapping from RGB to ClothingColor enum
  private readonly colorMap: { [key: string]: { range: { r: [number, number], g: [number, number], b: [number, number] }, name: ClothingColor } } = {
    red: { range: { r: [150, 255], g: [0, 100], b: [0, 100] }, name: ClothingColor.RED },
    blue: { range: { r: [0, 100], g: [0, 150], b: [150, 255] }, name: ClothingColor.BLUE },
    green: { range: { r: [0, 100], g: [150, 255], b: [0, 100] }, name: ClothingColor.GREEN },
    yellow: { range: { r: [200, 255], g: [200, 255], b: [0, 100] }, name: ClothingColor.YELLOW },
    orange: { range: { r: [200, 255], g: [100, 200], b: [0, 100] }, name: ClothingColor.ORANGE },
    purple: { range: { r: [100, 200], g: [0, 100], b: [150, 255] }, name: ClothingColor.PURPLE },
    pink: { range: { r: [200, 255], g: [100, 200], b: [150, 255] }, name: ClothingColor.PINK },
    brown: { range: { r: [100, 160], g: [50, 120], b: [30, 90] }, name: ClothingColor.BROWN },
    beige: { range: { r: [200, 255], g: [180, 230], b: [140, 200] }, name: ClothingColor.BEIGE },
    navy: { range: { r: [0, 50], g: [0, 50], b: [80, 150] }, name: ClothingColor.NAVY },
    black: { range: { r: [0, 60], g: [0, 60], b: [0, 60] }, name: ClothingColor.BLACK },
    white: { range: { r: [200, 255], g: [200, 255], b: [200, 255] }, name: ClothingColor.WHITE },
    gray: { range: { r: [80, 180], g: [80, 180], b: [80, 180] }, name: ClothingColor.GRAY }
  };

  /**
   * Analyze image colors from File object
   */
  async analyzeImageColors(file: File): Promise<ColorPalette> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Set canvas size for efficient processing
          const maxSize = 400;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const palette = this.extractColorPalette(imageData);
          
          resolve(palette);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract color palette from image data
   */
  private extractColorPalette(imageData: ImageData): ColorPalette {
    const data = imageData.data;
    const colorCounts: { [key: string]: { count: number; rgb: { r: number; g: number; b: number } } } = {};
    const step = 4; // Sample every 4th pixel for performance

    // Sample pixels and categorize colors
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip transparent pixels
      if (alpha < 128) continue;

      const clothingColor = this.rgbToClothingColor(r, g, b);
      const key = clothingColor;

      if (!colorCounts[key]) {
        colorCounts[key] = { count: 0, rgb: { r, g, b } };
      }
      colorCounts[key].count++;
    }

    // Convert to ColorInfo array and sort by frequency
    const totalPixels = Object.values(colorCounts).reduce((sum, color) => sum + color.count, 0);
    const colors: ColorInfo[] = Object.entries(colorCounts)
      .map(([colorName, data]) => ({
        color: colorName as ClothingColor,
        percentage: (data.count / totalPixels) * 100,
        hex: this.rgbToHex(data.rgb.r, data.rgb.g, data.rgb.b),
        rgb: data.rgb
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .filter(color => color.percentage > 2); // Filter out colors less than 2%

    const dominantColor = colors[0] || {
      color: ClothingColor.GRAY,
      percentage: 100,
      hex: '#808080',
      rgb: { r: 128, g: 128, b: 128 }
    };

    return {
      dominantColor,
      colors,
      totalAnalyzed: totalPixels
    };
  }

  /**
   * Map RGB values to ClothingColor enum
   */
  private rgbToClothingColor(r: number, g: number, b: number): ClothingColor {
    // Check if it matches any specific color range
    for (const [colorName, config] of Object.entries(this.colorMap)) {
      const { range } = config;
      if (
        r >= range.r[0] && r <= range.r[1] &&
        g >= range.g[0] && g <= range.g[1] &&
        b >= range.b[0] && b <= range.b[1]
      ) {
        return config.name;
      }
    }

    // Fallback logic for edge cases
    const brightness = (r + g + b) / 3;
    
    if (brightness < 60) return ClothingColor.BLACK;
    if (brightness > 200) return ClothingColor.WHITE;
    
    // Determine dominant channel
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    if (saturation < 0.3) {
      return brightness > 150 ? ClothingColor.WHITE : 
             brightness > 100 ? ClothingColor.GRAY : ClothingColor.BLACK;
    }

    if (r > g && r > b) return ClothingColor.RED;
    if (g > r && g > b) return ClothingColor.GREEN;
    if (b > r && b > g) return ClothingColor.BLUE;

    return ClothingColor.GRAY;
  }

  /**
   * Convert RGB to hex string
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Get color display name for UI
   */
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

  /**
   * Suggest top colors based on analysis
   */
  suggestColors(palette: ColorPalette): ClothingColor[] {
    // Return colors that are at least 5% of the image
    return palette.colors
      .filter(color => color.percentage >= 5)
      .slice(0, 5) // Limit to top 5 colors
      .map(color => color.color);
  }
} 