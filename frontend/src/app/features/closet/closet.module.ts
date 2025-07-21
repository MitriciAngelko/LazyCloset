import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

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
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

// Closet Components
import { ClosetViewComponent } from './closet-view/closet-view.component';
import { ItemEditModalComponent } from './item-edit-modal/item-edit-modal.component';
import { OutfitGeneratorModalComponent } from './outfit-generator-modal/outfit-generator-modal.component';

// Import Upload Module
import { UploadModule } from '../upload/upload.module';

// Closet Routes
const closetRoutes: Routes = [
  { path: '', component: ClosetViewComponent }
];

@NgModule({
  declarations: [
    ClosetViewComponent,
    ItemEditModalComponent,
    OutfitGeneratorModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(closetRoutes),
    UploadModule,
    DragDropModule,
    
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
    MatChipsModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClosetModule { } 