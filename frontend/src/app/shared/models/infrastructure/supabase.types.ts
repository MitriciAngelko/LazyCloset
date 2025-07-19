// Supabase Database Schema Types
export interface SupabaseDatabase {
  public: {
    Tables: {
      clothing_items: {
        Row: SupabaseClothingItemRow;
        Insert: SupabaseClothingItemInsert;
        Update: SupabaseClothingItemUpdate;
      };
      outfits: {
        Row: SupabaseOutfitRow;
        Insert: SupabaseOutfitInsert;
        Update: SupabaseOutfitUpdate;
      };
      outfit_items: {
        Row: SupabaseOutfitItemRow;
        Insert: SupabaseOutfitItemInsert;
        Update: SupabaseOutfitItemUpdate;
      };
    };
  };
}

// Clothing Items Table Types
export interface SupabaseClothingItemRow {
  id: string;
  user_id: string | null;
  category: string;
  image_url: string | null;
  thumbnail_url: string | null;
  original_filename: string | null;
  colors: string[] | null;
  tags: string[] | null;
  size: string | null;
  brand: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseClothingItemInsert {
  id?: string;
  user_id?: string | null;
  category: string;
  image_url?: string | null;
  thumbnail_url?: string | null;
  original_filename?: string | null;
  colors?: string[] | null;
  tags?: string[] | null;
  size?: string | null;
  brand?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseClothingItemUpdate {
  id?: string;
  user_id?: string | null;
  category?: string;
  image_url?: string | null;
  thumbnail_url?: string | null;
  original_filename?: string | null;
  colors?: string[] | null;
  tags?: string[] | null;
  size?: string | null;
  brand?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Outfits Table Types
export interface SupabaseOutfitRow {
  id: string;
  user_id: string | null;
  name: string;
  tags: string[] | null;
  occasion: string | null;
  season: string | null;
  weather: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseOutfitInsert {
  id?: string;
  user_id?: string | null;
  name: string;
  tags?: string[] | null;
  occasion?: string | null;
  season?: string | null;
  weather?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseOutfitUpdate {
  id?: string;
  user_id?: string | null;
  name?: string;
  tags?: string[] | null;
  occasion?: string | null;
  season?: string | null;
  weather?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Outfit Items Junction Table Types
export interface SupabaseOutfitItemRow {
  id: string;
  outfit_id: string;
  clothing_item_id: string;
  category_type: string; // 'hat', 'shirt', 'jacket', 'pants', 'shoes', 'accessory'
  created_at: string;
}

export interface SupabaseOutfitItemInsert {
  id?: string;
  outfit_id: string;
  clothing_item_id: string;
  category_type: string;
  created_at?: string;
}

export interface SupabaseOutfitItemUpdate {
  id?: string;
  outfit_id?: string;
  clothing_item_id?: string;
  category_type?: string;
  created_at?: string;
}

// Storage Types
export interface SupabaseStorageFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export interface SupabaseUploadResult {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  error: {
    message: string;
    name: string;
  } | null;
}

// Query Types
export interface SupabaseQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface SupabaseErrorResponse {
  message: string;
  details: string;
  hint: string;
  code: string;
}

// Connection Configuration
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  schema?: string;
}

// Client Types
export interface SupabaseClientConfig {
  auth: {
    persistSession: boolean;
    autoRefreshToken: boolean;
    detectSessionInUrl: boolean;
  };
  realtime?: {
    enabled: boolean;
  };
  global?: {
    headers: Record<string, string>;
  };
} 