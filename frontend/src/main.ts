import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import 'iconify-icon';

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
