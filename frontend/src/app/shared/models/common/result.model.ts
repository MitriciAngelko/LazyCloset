export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure {
  readonly success: false;
  readonly error: AppError;
}

export type Result<T> = Success<T> | Failure;

export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export class AppErrorImpl implements AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;

  constructor(code: string, message: string, details?: unknown) {
    this.code = code;
    this.message = message;
    this.details = details;
    this.timestamp = new Date();
  }

  static create(code: string, message: string, details?: unknown): AppError {
    return new AppErrorImpl(code, message, details);
  }
}

export const ResultUtils = {
  success<T>(data: T): Success<T> {
    return { success: true, data };
  },

  failure(error: AppError): Failure {
    return { success: false, error };
  },

  failureFromError(code: string, message: string, details?: unknown): Failure {
    return {
      success: false,
      error: AppErrorImpl.create(code, message, details)
    };
  },

  isSuccess<T>(result: Result<T>): result is Success<T> {
    return result.success;
  },

  isFailure<T>(result: Result<T>): result is Failure {
    return !result.success;
  },

  map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
    if (ResultUtils.isSuccess(result)) {
      try {
        return ResultUtils.success(fn(result.data));
      } catch (error) {
        return ResultUtils.failureFromError(
          'MAPPING_ERROR',
          'Error occurred during result mapping',
          error
        );
      }
    }
    return result;
  },

  mapAsync<T, U>(result: Result<T>, fn: (data: T) => Promise<U>): Promise<Result<U>> {
    if (ResultUtils.isSuccess(result)) {
      return fn(result.data)
        .then(data => ResultUtils.success(data))
        .catch(error => ResultUtils.failureFromError(
          'ASYNC_MAPPING_ERROR',
          'Error occurred during async result mapping',
          error
        ));
    }
    return Promise.resolve(result);
  },

  flatMap<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> {
    if (ResultUtils.isSuccess(result)) {
      try {
        return fn(result.data);
      } catch (error) {
        return ResultUtils.failureFromError(
          'FLAT_MAPPING_ERROR',
          'Error occurred during result flat mapping',
          error
        );
      }
    }
    return result;
  }
};

export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Business logic errors
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  DUPLICATE_ITEM: 'DUPLICATE_ITEM',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const; 