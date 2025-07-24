// Domain Models (Primary exports)
export * from './domain/clothing.model';
export * from './domain/outfit.model';
export * from './domain/upload.model';

// Infrastructure Types
export * from './infrastructure/supabase.types';

// Application DTOs
export * from './dtos/clothing.dto';

// Common Types
export * from './common/result.model';
export * from './common/pagination.model';
export * from './common/error.model';

// Legacy Models (Deprecated - for backward compatibility only)
// TODO: Remove these exports after migrating all components to domain models
// Note: These exports are commented out to avoid conflicts with domain models
// export * from './clothing.models'; 