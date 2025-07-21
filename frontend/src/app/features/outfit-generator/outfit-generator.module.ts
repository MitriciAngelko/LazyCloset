import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

import { OutfitGeneratorComponent } from './outfit-generator.component';

@NgModule({
  declarations: [
    OutfitGeneratorComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: OutfitGeneratorComponent }
    ]),
    DragDropModule,
    
    // Angular Material
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  exports: [
    OutfitGeneratorComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OutfitGeneratorModule { } 