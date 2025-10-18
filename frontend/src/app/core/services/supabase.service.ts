import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigService } from './config.service';

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
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  public session$: Observable<Session | null> = this.sessionSubject.asObservable();

  constructor(private configService: ConfigService) {
    const config = this.configService.getSupabaseConfig();
    this.supabase = createClient<Database>(
      config.url,
      config.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    // Initialize auth state
    this.initializeAuth();
    console.log('Supabase client initialized with authentication enabled');
  }

  /**
   * Initialize authentication state and listen for auth changes
   */
  private async initializeAuth(): Promise<void> {
    // Get initial session
    const { data: { session } } = await this.supabase.auth.getSession();
    this.sessionSubject.next(session);
    this.currentUserSubject.next(session?.user || null);

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user');
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user || null);
    });
  }

  // Authentication Methods
  
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    return { user: data.user, error };
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { user: data.user, error };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      // Clear local session state even if Supabase API fails
      // This prevents the user from being stuck in a logged-in state
      if (error) {
        console.warn('Supabase sign out failed, clearing local session:', error);
        // Manually clear the session
        this.sessionSubject.next(null);
        this.currentUserSubject.next(null);
        // Clear local storage
        localStorage.removeItem('supabase.auth.token');
      }

      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear local session on any error
      this.sessionSubject.next(null);
      this.currentUserSubject.next(null);
      localStorage.removeItem('supabase.auth.token');
      return { error };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.sessionSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
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