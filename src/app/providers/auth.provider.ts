import { inject, provideAppInitializer } from '@angular/core'
import { AuthService } from '../services/auth.service'

export function provideAuth() {
  return [
    provideAppInitializer(async () => {
      await inject(AuthService).bootstrapSession()
    }),
  ]
}
