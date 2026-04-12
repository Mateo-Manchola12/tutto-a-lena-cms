import { Component, effect, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Business } from '../../types/business'
import { BusinessService } from '../services/business.service'

@Component({
  selector: 'app-contact-info',
  template: `
    @if (businessService.loading()) {
      <div class="flex h-full w-full items-center justify-center">
        <div
          class="border-primary border-r-primary-active size-20 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
      </div>
    } @else if (businessService.businessData()) {
      <form class="relative mx-auto flex max-w-6xl flex-col gap-6 pb-10" [formGroup]="form">
        <div
          class="from-primary/10 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br via-transparent to-transparent blur-3xl"
        ></div>

        <header
          class="from-surface-light to-surface/80 rounded-2xl border border-white/10 bg-linear-to-br p-6 shadow-xl"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="font-display text-3xl leading-tight font-bold lg:text-4xl">Datos de Contacto</h1>
              <p class="text-muted-foreground max-w-2xl text-sm">
                Configura teléfono, email y WhatsApp para que el objeto Business tenga todos los campos de contacto
                consistentes.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="bg-primary/15 text-primary border-primary/30 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
              >
                @if (form.dirty && form.valid) {
                  <i class="mat-icon mr-1 text-sm leading-none">check_circle</i>
                  Borrador listo
                } @else if (form.dirty && form.invalid) {
                  <i class="mat-icon mr-1 text-sm leading-none">error</i>
                  Hay errores en el formulario
                } @else {
                  <i class="mat-icon mr-1 text-sm leading-none">check</i>
                  Sin cambios por guardar
                }
              </span>
              <button class="button min-w-44" type="button" (click)="onSave()" [disabled]="!form.dirty">
                Guardar Cambios
              </button>
            </div>
          </div>
        </header>

        <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Teléfono</h2>

            <div class="grid grid-cols-1 gap-4" formGroupName="phone">
              <mat-form-field>
                <mat-label>Número base (raw)</mat-label>
                <input matInput formControlName="raw" placeholder="+541100000000" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Número visible (display)</mat-label>
                <input matInput formControlName="display" placeholder="+54 (011) XXXX-XXXX" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Enlace (href)</mat-label>
                <input matInput formControlName="href" readonly />
              </mat-form-field>
            </div>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Email</h2>

            <div class="grid grid-cols-1 gap-4" formGroupName="email">
              <mat-form-field>
                <mat-label>Email visible (display)</mat-label>
                <input matInput formControlName="display" placeholder="info@tutto-a-lena.com" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Enlace (href)</mat-label>
                <input matInput formControlName="href" readonly />
              </mat-form-field>
            </div>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg xl:col-span-2"
          >
            <h2 class="mb-5 text-2xl font-bold">WhatsApp</h2>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2" formGroupName="whatsapp">
              <mat-form-field>
                <mat-label>Número base (raw)</mat-label>
                <input matInput formControlName="raw" placeholder="5491100000000" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Número visible (display)</mat-label>
                <input matInput formControlName="display" placeholder="+54 911 XXXX-XXXX" />
              </mat-form-field>

              <mat-form-field class="lg:col-span-2">
                <mat-label>Enlace (href)</mat-label>
                <input matInput formControlName="href" readonly />
              </mat-form-field>
            </div>
          </section>
        </div>
      </form>
    }
  `,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
})
export class ContactInfoPage {
  businessService = inject(BusinessService)
  private snackbar = inject(MatSnackBar)
  private formBuilder = inject(FormBuilder)

  private autoPhoneHref = true
  private autoEmailHref = true
  private autoWhatsappHref = true

  form = this.formBuilder.nonNullable.group({
    phone: this.formBuilder.nonNullable.group({
      display: [''],
      raw: [''],
      href: [''],
    }),
    email: this.formBuilder.nonNullable.group({
      display: [''],
      href: [''],
    }),
    whatsapp: this.formBuilder.nonNullable.group({
      display: [''],
      raw: [''],
      href: [''],
    }),
  })

  constructor() {
    this.setupAutoHrefBindings()

    effect(() => {
      const business = this.businessService.businessData()

      if (!business) {
        return
      }

      this.form.setValue(this.mapBusinessToFormValue(business))
      this.recomputeAutoFlags()
    })
  }

  onSave() {
    const current = this.businessService.businessData()

    if (!current) {
      this.snackbar.open('No hay información cargada para guardar', 'Cerrar', {
        duration: 3000,
      })
      return
    }

    const formValue = this.form.getRawValue()
    const updatedBusiness: Business = {
      ...current,
      phone: formValue.phone,
      email: formValue.email,
      whatsapp: formValue.whatsapp,
    }

    this.businessService
      .saveBusinessData(updatedBusiness)
      .then(() => {
        this.form.markAsPristine()
        this.snackbar.open('Datos de contacto actualizados exitosamente', 'Cerrar', {
          duration: 3000,
        })
      })
      .catch((error: unknown) => {
        this.snackbar.open((error as Error).message || 'Error al guardar los cambios, contacte al soporte', 'Cerrar', {
          duration: 5000,
        })
      })
  }

  private mapBusinessToFormValue(business: Business) {
    return {
      phone: {
        display: business.phone.display,
        raw: business.phone.raw,
        href: business.phone.href,
      },
      email: {
        display: business.email.display,
        href: business.email.href,
      },
      whatsapp: {
        display: business.whatsapp.display,
        raw: business.whatsapp.raw,
        href: business.whatsapp.href,
      },
    }
  }

  private setupAutoHrefBindings() {
    const phoneRaw = this.form.controls.phone.controls.raw
    const phoneHref = this.form.controls.phone.controls.href
    const emailDisplay = this.form.controls.email.controls.display
    const emailHref = this.form.controls.email.controls.href
    const whatsappRaw = this.form.controls.whatsapp.controls.raw
    const whatsappHref = this.form.controls.whatsapp.controls.href

    phoneRaw.valueChanges.pipe(takeUntilDestroyed()).subscribe((raw) => {
      if (!this.autoPhoneHref) {
        return
      }

      phoneHref.setValue(this.buildPhoneHref(raw), { emitEvent: false })
    })

    phoneHref.valueChanges.pipe(takeUntilDestroyed()).subscribe((href) => {
      this.autoPhoneHref = href.trim() === '' || href === this.buildPhoneHref(phoneRaw.value)
    })

    emailDisplay.valueChanges.pipe(takeUntilDestroyed()).subscribe((display) => {
      if (!this.autoEmailHref) {
        return
      }

      emailHref.setValue(this.buildEmailHref(display), { emitEvent: false })
    })

    emailHref.valueChanges.pipe(takeUntilDestroyed()).subscribe((href) => {
      this.autoEmailHref = href.trim() === '' || href === this.buildEmailHref(emailDisplay.value)
    })

    whatsappRaw.valueChanges.pipe(takeUntilDestroyed()).subscribe((raw) => {
      if (!this.autoWhatsappHref) {
        return
      }

      whatsappHref.setValue(this.buildWhatsappHref(raw), { emitEvent: false })
    })

    whatsappHref.valueChanges.pipe(takeUntilDestroyed()).subscribe((href) => {
      this.autoWhatsappHref = href.trim() === '' || href === this.buildWhatsappHref(whatsappRaw.value)
    })
  }

  private recomputeAutoFlags() {
    const phoneRaw = this.form.controls.phone.controls.raw.value
    const phoneHref = this.form.controls.phone.controls.href.value
    const emailDisplay = this.form.controls.email.controls.display.value
    const emailHref = this.form.controls.email.controls.href.value
    const whatsappRaw = this.form.controls.whatsapp.controls.raw.value
    const whatsappHref = this.form.controls.whatsapp.controls.href.value

    this.autoPhoneHref = phoneHref.trim() === '' || phoneHref === this.buildPhoneHref(phoneRaw)
    this.autoEmailHref = emailHref.trim() === '' || emailHref === this.buildEmailHref(emailDisplay)
    this.autoWhatsappHref = whatsappHref.trim() === '' || whatsappHref === this.buildWhatsappHref(whatsappRaw)
  }

  private buildPhoneHref(raw: string): string {
    const normalized = raw.trim().replace(/[^\d+]/g, '')

    if (!normalized) {
      return ''
    }

    return `tel:${normalized}`
  }

  private buildEmailHref(display: string): string {
    const normalized = display.trim()

    if (!normalized) {
      return ''
    }

    return `mailto:${normalized}`
  }

  private buildWhatsappHref(raw: string): string {
    const normalized = raw.replace(/\D/g, '')

    if (!normalized) {
      return ''
    }

    const defaultMessage = encodeURIComponent('Hola Tutto a Leña!')
    return `https://wa.me/${normalized}?text=${defaultMessage}`
  }
}
