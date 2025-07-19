import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.supabaseService.currentUser$.pipe(
      map(user => {
        if (!user) {
          return true; // Allow access to auth pages if not logged in
        } else {
          // Redirect to closet if already authenticated
          return this.router.createUrlTree(['/closet']);
        }
      })
    );
  }
} 