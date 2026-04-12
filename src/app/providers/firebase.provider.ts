import { InjectionToken } from '@angular/core'
import { initializeApp, type FirebaseApp as App } from 'firebase/app'
import { environment } from '../../environments/environment'

export const FirebaseApp = new InjectionToken<App>('firebase.app')

export function provideFirebaseApp() {
  return {
    provide: FirebaseApp,
    useFactory: () => initializeApp(environment.firebase),
  }
}
