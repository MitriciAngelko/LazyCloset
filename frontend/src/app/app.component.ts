import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './core/services/supabase.service';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'LazyCloset';
  currentUser$: Observable<User | null>;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private configService: ConfigService
  ) {
    this.currentUser$ = this.supabaseService.currentUser$;
  }

  ngOnInit(): void {
    // Initialize any app-wide logic here
    console.log('LazyCloset app initialized');
    // Test environment variable loading
    console.log('🔧 Environment Configuration Test:');
    console.log('Supabase URL:', this.configService.getSupabaseConfig().url);
    console.log('Remove.bg API Key:', this.configService.getRemoveBgApiKey() ? '✅ Loaded' : '❌ Not loaded');
    console.log('Production mode:', this.configService.isProduction());
  }

  /**
   * Sign out current user
   */
  async onSignOut(): Promise<void> {
    try {
      const { error } = await this.supabaseService.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('✅ User signed out successfully');
        this.router.navigate(['/auth/login']);
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  }
}
