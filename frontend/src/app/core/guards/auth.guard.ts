import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.supabaseService.currentUser$.pipe(
      map(user => {
        if (user) {
          return true;
        } else {
          // Redirect to login if not authenticated
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
} 