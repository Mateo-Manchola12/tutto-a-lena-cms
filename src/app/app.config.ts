import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'

import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar'
import { routes } from './app.routes'
import { provideAuth } from './providers/auth.provider'
import { provideFirebaseApp, provideFirebaseStorage } from './providers/firebase.provider'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(),
    provideFirebaseStorage(),
    provideAuth(),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 3000,
        horizontalPosition: 'right' as const,
        verticalPosition: 'bottom' as const,
        panelClass: ['*:border!'],
      },
    },
  ],
}
