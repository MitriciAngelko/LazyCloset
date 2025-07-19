import { Observable } from 'rxjs';
import { 
  UploadFile, 
  ProcessedImage, 
  ImageUploadOptions, 
  UploadProgress 
} from '../../shared/models/domain/upload.model';
import { Result } from '../../shared/models/common/result.model';

export interface FileUploadRepository {
  // Image upload operations
  uploadImage(file: UploadFile, options?: ImageUploadOptions): Observable<Result<ProcessedImage>>;
  
  // Progress tracking
  getUploadProgress(fileId: string): Observable<UploadProgress>;
  
  // File management
  deleteFile(url: string): Observable<Result<void>>;
  getFileInfo(url: string): Observable<Result<FileInfo>>;
  
  // Validation
  validateFile(file: File): Result<void>;
  
  // Bulk operations
  uploadMultipleImages(files: UploadFile[], options?: ImageUploadOptions): Observable<Result<ProcessedImage[]>>;
}

export interface FileInfo {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url: string;
  readonly lastModified: Date;
  readonly metadata: {
    readonly width?: number;
    readonly height?: number;
    readonly quality?: number;
  };
} 