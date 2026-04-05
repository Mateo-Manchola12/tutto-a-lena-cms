import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'
import { provideAuth } from './providers/auth.provider'
import { provideFirebaseApp } from './providers/firebase.provider'

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideFirebaseApp(), provideAuth()],
}
