import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

// ✅ GLOBAL ERROR SAFETY (prevents white screen)
window.addEventListener('error', (event) => {
  console.error('Global JS Error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
