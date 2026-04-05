import { inject, Injectable, signal } from '@angular/core'
import { FirebaseError } from '@firebase/util'
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import type { LoginResult } from '../../types/auth'
import { FirebaseApp } from '../providers/firebase.provider'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _app = inject(FirebaseApp)
  private _auth = getAuth(this._app)
  private _user$ = signal(this._auth.currentUser)

  constructor() {
    onAuthStateChanged(this._auth, (user) => {
      this._user$.set(user)
    })
  }

  async login(email: string, password: string): Promise<LoginResult> {
    return await signInWithEmailAndPassword(this._auth, email, password)
      .then(() => ({ ok: true as const }))
      .catch((error: unknown) => {
        if (error instanceof FirebaseError && error.code === 'auth/invalid-credential') {
          console.error('Credenciales incorrectas')
          return { ok: false, reason: 'Correo o contraseña incorrectos' }
        }
        console.error('Error desconocido durante el inicio de sesión', error)
        return { ok: false, reason: 'Error al iniciar sesión, contacte al soporte' }
      })
  }

  isAuthenticated(): boolean {
    return !!this._user$()
  }

  async bootstrapSession() {
    try {
      await setPersistence(this._auth, browserLocalPersistence)
    } catch (error) {
      console.error('No se pudo establecer la persistencia de sesión', error)
    }
  }

  get user() {
    return this._user$.asReadonly()
  }
}
