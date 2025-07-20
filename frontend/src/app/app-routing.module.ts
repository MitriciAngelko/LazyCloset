import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  // Default route - redirect to outfit generator
  { 
    path: '', 
    redirectTo: '/outfit-generator', 
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
    path: 'outfit-generator',
    loadChildren: () => import('./features/outfit-generator/outfit-generator.module').then(m => m.OutfitGeneratorModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'closet',
    loadChildren: () => import('./features/closet/closet.module').then(m => m.ClosetModule),
    canActivate: [AuthGuard]
  },
  
  // Fallback route
  { 
    path: '**', 
    redirectTo: '/outfit-generator' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
