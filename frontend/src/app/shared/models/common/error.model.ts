/**
 * Standardized error types for the LazyCloset application
 */

export enum ErrorType {
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  DUPLICATE_ITEM = 'DUPLICATE_ITEM',
  
  // File/Upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ApplicationError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class AppErrorBuilder {
  private error: Partial<ApplicationError> = {
    timestamp: new Date()
  };

  withType(type: ErrorType): AppErrorBuilder {
    this.error.type = type;
    return this;
  }

  withMessage(message: string): AppErrorBuilder {
    this.error.message = message;
    return this;
  }

  withCode(code: string): AppErrorBuilder {
    this.error.code = code;
    return this;
  }

  withDetails(details: any): AppErrorBuilder {
    this.error.details = details;
    return this;
  }

  withContext(context: string): AppErrorBuilder {
    this.error.context = context;
    return this;
  }

  build(): ApplicationError {
    if (!this.error.type || !this.error.message) {
      throw new Error('Error type and message are required');
    }
    return this.error as ApplicationError;
  }
}

export function createError(type: ErrorType, message: string, details?: any): ApplicationError {
  return new AppErrorBuilder()
    .withType(type)
    .withMessage(message)
    .withDetails(details)
    .build();
}

export function isApplicationError(error: any): error is ApplicationError {
  return error && typeof error === 'object' && 'type' in error && 'message' in error;
} 