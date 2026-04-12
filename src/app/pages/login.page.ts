import { Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatRipple } from '@angular/material/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { getValidationErrorMessage } from '../utils/validation-error-message'

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatRipple],
  template: `
    <main class="mx-auto flex h-full w-lg flex-col items-stretch justify-center gap-14 px-2">
      <h1 class="text-center text-4xl">Iniciar Sesión</h1>
      <form
        class="flex flex-col items-stretch justify-center gap-4"
        [formGroup]="form"
        (submit)="$event.preventDefault(); login()"
      >
        <mat-form-field>
          <mat-label>Correo Electrónico</mat-label>
          <input
            id="email"
            matInput
            type="email"
            autocomplete="username"
            placeholder="Ingrese su correo electrónico"
            formControlName="email"
          />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <mat-error>{{ emailErrorMessage() }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Contraseña</mat-label>
          <input
            id="password"
            matInput
            [type]="isVisible() ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Ingrese su contraseña"
            formControlName="password"
          />
          <i matSuffix class="cursor-pointer" (click)="togglePasswordVisibility()">{{
            this.isVisible() ? 'visibility_off' : 'visibility'
          }}</i>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <mat-error>{{ passwordErrorMessage() }}</mat-error>
          }
        </mat-form-field>
        <button matRipple matRippleColor="#00000022" type="submit" class="button">
          Iniciar Sesión <i class="mat-icon">arrow_forward</i>
        </button>
      </form>
    </main>
  `,
})
export class LoginPage {
  auth = inject(AuthService)
  snackbar = inject(MatSnackBar)
  router = inject(Router)

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [Validators.required]),
  })
  isVisible = signal(false)

  async login() {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    const { email, password } = this.form.value
    if (email && password) {
      const res = await this.auth.login(email, password)

      if (!res.ok) {
        this.snackbar.open(res.reason, 'Cerrar', { duration: 5000 })
      } else {
        this.snackbar.open('¡Inicio de sesión exitoso!', 'Cerrar', { duration: 3000 })

        void this.router.navigate(['/dashboard'])
      }
    }
  }

  togglePasswordVisibility() {
    this.isVisible.update((visible) => !visible)
  }

  emailErrorMessage() {
    return getValidationErrorMessage(this.form.controls.email, 'el correo electrónico')
  }

  passwordErrorMessage() {
    return getValidationErrorMessage(this.form.controls.password, 'la contraseña')
  }
}
