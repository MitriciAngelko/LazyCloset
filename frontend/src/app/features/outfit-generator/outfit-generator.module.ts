import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
    
    // Angular Material
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  exports: [
    OutfitGeneratorComponent
  ]
})
export class OutfitGeneratorModule { } 