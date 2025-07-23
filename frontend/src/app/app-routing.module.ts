import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  // Default route - redirect to closet
  { 
    path: '', 
    redirectTo: '/closet', 
    pathMatch: 'full' 
  },
  
  // Auth routes (login, register) - only accessible when not logged in
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    canActivate: [GuestGuard]
  },
  
  // Protected routes - require authentication
  {
    path: 'closet',
    loadChildren: () => import('./features/closet/closet.module').then(m => m.ClosetModule),
    canActivate: [AuthGuard]
  },
  
  // Fallback route
  { 
    path: '**', 
    redirectTo: '/closet' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
