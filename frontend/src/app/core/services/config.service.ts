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

    // In development, you can override with local storage or other sources
    if (!config.production) {
      // Check for local storage overrides (for development)
      const localConfig = this.getLocalStorageConfig();
      if (localConfig) {
        config.supabase = { ...config.supabase, ...localConfig.supabase };
        config.removeBg = { ...config.removeBg, ...localConfig.removeBg };
      }
    }

    return config;
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