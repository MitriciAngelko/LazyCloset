import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Database {
  public: {
    Tables: {
      clothing_items: {
        Row: {
          id: string;
          user_id: string | null;
          category: string;
          image_url: string | null;
          thumbnail_url: string | null;
          original_filename: string | null;
          colors: string[] | null;
          tags: string[] | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          category: string;
          image_url?: string | null;
          thumbnail_url?: string | null;
          original_filename?: string | null;
          colors?: string[] | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          category?: string;
          image_url?: string | null;
          thumbnail_url?: string | null;
          original_filename?: string | null;
          colors?: string[] | null;
          tags?: string[] | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      outfits: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          items: any;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          items?: any;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          items?: any;
          is_favorite?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    console.log('Supabase client initialized (auth disabled)');
  }

  // Database Methods
  get db() {
    return this.supabase.from('clothing_items');
  }

  get outfitsDb() {
    return this.supabase.from('outfits');
  }

  // Storage Methods
  get storage() {
    return this.supabase.storage;
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(file: File, path: string): Promise<{ url: string | null; error: any }> {
    try {
      console.log(`🔄 Uploading image: ${path}, Size: ${file.size} bytes, Type: ${file.type}`);
      
      const { data, error } = await this.supabase.storage
        .from('clothing-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        return { url: null, error };
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('clothing-images')
        .getPublicUrl(path);

      console.log('📎 Public URL generated:', publicUrl);
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('❌ Upload exception:', error);
      return { url: null, error };
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(path: string): Promise<{ error: any }> {
    const { error } = await this.supabase.storage
      .from('clothing-images')
      .remove([path]);

    return { error };
  }

  /**
   * Get Supabase client for direct access
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Initialize storage bucket if not exists
   */
  async initializeStorage(): Promise<void> {
    // Skip automatic bucket creation - we'll create it manually in the dashboard
    console.log('Supabase storage initialized (bucket should be created manually)');
  }
} 