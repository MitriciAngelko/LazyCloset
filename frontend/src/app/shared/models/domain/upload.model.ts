export interface UploadFile {
  readonly file: File;
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

export interface ImageUploadOptions {
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly quality?: number;
  readonly format?: 'jpeg' | 'png' | 'webp';
  readonly thumbnailSize?: number;
}

export interface UploadProgress {
  readonly fileId: string;
  readonly progress: number; // 0-100
  readonly status: UploadStatus;
  readonly uploadedBytes: number;
  readonly totalBytes: number;
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface UploadResult {
  readonly success: boolean;
  readonly fileId: string;
  readonly originalUrl?: string;
  readonly thumbnailUrl?: string;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly error?: string;
}

export interface ProcessedImage {
  readonly originalUrl: string;
  readonly thumbnailUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly dimensions: ImageDimensions;
}

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export class UploadValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  static validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`File type must be one of: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    if (file.name.length > 255) {
      errors.push('File name must be less than 255 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static isImageFile(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type);
  }

  static getFileSizeInMB(sizeInBytes: number): number {
    return Math.round((sizeInBytes / 1024 / 1024) * 100) / 100;
  }
}

export class UploadFileEntity implements UploadFile {
  readonly file: File;
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;

  constructor(file: File, id?: string) {
    const validation = UploadValidator.validateFile(file);
    if (!validation.valid) {
      throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
    }

    this.file = file;
    this.id = id || this.generateId();
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
  }

  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSizeInMB(): number {
    return UploadValidator.getFileSizeInMB(this.size);
  }

  isImage(): boolean {
    return UploadValidator.isImageFile(this.file);
  }
} 