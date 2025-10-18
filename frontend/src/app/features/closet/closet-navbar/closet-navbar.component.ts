import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

export interface ButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-closet-navbar',
  standalone: false,
  templateUrl: './closet-navbar.component.html',
  styleUrl: './closet-navbar.component.scss'
})
export class ClosetNavbarComponent {
  @ViewChild('addBtn') addBtnRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('createBtn') createBtnRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('filterBtn') filterBtnRef!: ElementRef<HTMLButtonElement>;

  // Inputs from parent
  @Input() layoutMode: 'scatter' | 'grid' = 'scatter';
  @Input() isFilterOpen = false;
  @Input() searchTerm = '';

  // Outputs to parent - now with position data
  @Output() toggleLayout = new EventEmitter<void>();
  @Output() addPiece = new EventEmitter<ButtonPosition>();
  @Output() createLook = new EventEmitter<ButtonPosition>();
  @Output() toggleFilter = new EventEmitter<ButtonPosition>();
  @Output() searchChange = new EventEmitter<string>();

  onToggleLayout(): void {
    this.toggleLayout.emit();
  }

  onAddPiece(): void {
    const position = this.getButtonPosition(this.addBtnRef);

    // Add morphing class to button for iOS-style liquid animation
    if (this.addBtnRef?.nativeElement) {
      this.addBtnRef.nativeElement.classList.add('morphing');

      // Remove class after animation (1.2s = iOS Dynamic Island timing)
      setTimeout(() => {
        this.addBtnRef?.nativeElement?.classList.remove('morphing');
      }, 1200);
    }

    this.addPiece.emit(position);
  }

  onCreateLook(): void {
    const position = this.getButtonPosition(this.createBtnRef);

    // Add morphing class to button for iOS-style liquid animation
    if (this.createBtnRef?.nativeElement) {
      this.createBtnRef.nativeElement.classList.add('morphing');

      // Remove class after animation (1.2s = iOS Dynamic Island timing)
      setTimeout(() => {
        this.createBtnRef?.nativeElement?.classList.remove('morphing');
      }, 1200);
    }

    this.createLook.emit(position);
  }

  onToggleFilter(): void {
    const position = this.getButtonPosition(this.filterBtnRef);
    this.toggleFilter.emit(position);
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  }

  private getButtonPosition(btnRef: ElementRef<HTMLButtonElement>): ButtonPosition {
    if (!btnRef || !btnRef.nativeElement) {
      // Fallback to center if button ref not available
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 36,
        height: 36
      };
    }

    const rect = btnRef.nativeElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  }
}
