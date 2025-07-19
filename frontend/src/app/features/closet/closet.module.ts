import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Material Modules
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Closet Components
import { ClosetViewComponent } from './closet-view/closet-view.component';

// Import Upload Module
import { UploadModule } from '../upload/upload.module';

// Closet Routes
const closetRoutes: Routes = [
  { path: '', component: ClosetViewComponent }
];

@NgModule({
  declarations: [
    ClosetViewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(closetRoutes),
    UploadModule,
    
    // Material Modules
    MatTabsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  providers: []
})
export class ClosetModule { } 