import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  removeBg: {
    apiKey: string;
  };
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment and any additional sources
   */
  private loadConfiguration(): AppConfig {
    // Start with environment configuration
    const config: AppConfig = {
      supabase: {
        url: environment.supabase.url,
        anonKey: environment.supabase.anonKey
      },
      removeBg: {
        apiKey: environment.removeBg.apiKey
      },
      production: environment.production
    };

    // In development, try to load from .env file first
    if (!config.production) {
      const envConfig = this.loadEnvConfig();
      if (envConfig) {
        config.supabase = { ...config.supabase, ...envConfig.supabase };
        config.removeBg = { ...config.removeBg, ...envConfig.removeBg };
      }

      // Then check for local storage overrides (for development)
      const localConfig = this.getLocalStorageConfig();
      if (localConfig) {
        config.supabase = { ...config.supabase, ...localConfig.supabase };
        config.removeBg = { ...config.removeBg, ...localConfig.removeBg };
      }
    }

    return config;
  }

  /**
   * Load configuration from .env file
   */
  private loadEnvConfig(): Partial<AppConfig> | null {
    try {
      const envVars = this.parseEnvFile();
      if (envVars) {
        return {
          supabase: {
            url: envVars['SUPABASE_URL'] || '',
            anonKey: envVars['SUPABASE_ANON_KEY'] || ''
          },
          removeBg: {
            apiKey: envVars['REMOVE_BG_API_KEY'] || ''
          }
        };
      }
    } catch (error) {
      console.warn('Could not load .env file:', error);
    }
    return null;
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(): Record<string, string> | null {
    try {
      const envVars: Record<string, string> = {};
      
      // Try to get from window object (if set by build process)
      if (typeof window !== 'undefined' && (window as any).__ENV__) {
        return (window as any).__ENV__;
      }

      // For now, return null since we're using hardcoded values in environment files
      // In a production setup, you would use build-time environment variable replacement
      // or a secure API endpoint to retrieve configuration
      return null;
    } catch (error) {
      console.warn('Error parsing .env file:', error);
      return null;
    }
  }

  /**
   * Get configuration from local storage (development only)
   */
  private getLocalStorageConfig(): Partial<AppConfig> | null {
    try {
      const stored = localStorage.getItem('lazy-closet-config');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get Supabase configuration
   */
  getSupabaseConfig() {
    return this.config.supabase;
  }

  /**
   * Get Remove.bg API key
   */
  getRemoveBgApiKey(): string {
    return this.config.removeBg.apiKey;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.production;
  }

  /**
   * Get full configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (development only)
   */
  updateConfig(updates: Partial<AppConfig>): void {
    if (!this.isProduction()) {
      this.config = { ...this.config, ...updates };
      
      // Store in local storage for development
      try {
        localStorage.setItem('lazy-closet-config', JSON.stringify(updates));
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Clear local configuration
   */
  clearLocalConfig(): void {
    if (!this.isProduction()) {
      localStorage.removeItem('lazy-closet-config');
      this.config = this.loadConfiguration();
    }
  }
} 