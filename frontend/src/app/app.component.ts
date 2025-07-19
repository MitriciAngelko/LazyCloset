import { Component } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
  selectedTabIndex = 0;

  /**
   * Handle tab change events
   */
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    
    // Optional: Add analytics or other logic here
    const tabLabels = ['Upload', 'My Closet', 'Outfit Generator'];
    console.log(`Switched to tab: ${tabLabels[event.index]}`);
  }

  /**
   * Navigate to specific tab programmatically
   */
  navigateToTab(tabIndex: number): void {
    this.selectedTabIndex = tabIndex;
  }
}
