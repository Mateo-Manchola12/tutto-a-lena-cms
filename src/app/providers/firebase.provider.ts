import { InjectionToken } from '@angular/core'
import { initializeApp, type FirebaseApp as App } from 'firebase/app'
import { getStorage, type FirebaseStorage as Storage } from 'firebase/storage'
import { environment } from '../../environments/environment'

export const FirebaseApp = new InjectionToken<App>('firebase.app')
export const FirebaseStorage = new InjectionToken<Storage>('firebase.storage')

export function provideFirebaseApp() {
  return {
    provide: FirebaseApp,
    useFactory: () => initializeApp(environment.firebase),
  }
}

export function provideFirebaseStorage() {
  return {
    provide: FirebaseStorage,
    useFactory: (app: App) => getStorage(app),
    deps: [FirebaseApp],
  }
}
