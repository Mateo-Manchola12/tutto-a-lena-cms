import { Component, effect, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Business } from '../../types/business'
import { BusinessService } from '../services/business.service'

@Component({
  selector: 'app-general-info',
  template: `
    @if (businessService.loading()) {
      <div class="flex h-full w-full items-center justify-center">
        <div
          class="border-primary border-r-primary-active size-20 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
      </div>
    } @else if (businessService.businessData()) {
      <form class="relative mx-auto flex max-w-7xl flex-col gap-6 pb-10" [formGroup]="form">
        <div
          class="from-primary/10 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br via-transparent to-transparent blur-3xl"
        ></div>

        <header
          class="from-surface-light to-surface/80 rounded-2xl border border-white/10 bg-linear-to-br p-6 shadow-xl"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="font-display text-3xl leading-tight font-bold lg:text-4xl">Información General</h1>
              <p class="text-muted-foreground max-w-2xl text-sm">
                Ajusta la identidad del negocio, horarios de operación y presencia digital desde una sola pantalla.
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

        <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg xl:col-span-2"
          >
            <div class="mb-5 flex items-center justify-between gap-3">
              <h2 class="text-2xl font-bold">Información Básica</h2>
              <small class="text-muted-foreground text-xs">Usada para SEO y metadatos</small>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <mat-form-field>
                <mat-label>Nombre del negocio</mat-label>
                <input matInput formControlName="name" placeholder="Tutto a Leña" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Descripción del negocio</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="4"
                  placeholder="Restaurante de cocina a leña con experiencia familiar"
                ></textarea>
              </mat-form-field>
            </div>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Otra Información</h2>

            <div class="grid grid-cols-1 gap-4">
              <mat-form-field>
                <mat-label>Rango de Precios</mat-label>
                <mat-select formControlName="priceRange">
                  <mat-option value="$">$</mat-option>
                  <mat-option value="$$">$$</mat-option>
                  <mat-option value="$$$">$$$</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Año de fundación</mat-label>
                <mat-select formControlName="foundedYear">
                  @for (year of YEARS; track year) {
                    <mat-option [value]="year">{{ year }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg xl:col-span-2"
          >
            <div class="mb-5 space-y-1">
              <h2 class="text-2xl font-bold">Horarios de Atención</h2>
              <p class="text-muted-foreground text-sm">
                Define los horarios de de atención para cada día de la semana.
              </p>
            </div>

            <div class="space-y-3" formGroupName="hours">
              @for (day of DAYS; track day) {
                <div
                  [formGroupName]="day"
                  class="bg-surface-dark/60 grid grid-cols-1 items-center gap-3 rounded-xl border border-white/10 p-3 md:grid-cols-[140px_1fr_auto_1fr]"
                >
                  <span class="text-foreground/95 font-medium">{{ day }}</span>

                  <mat-form-field class="w-full" subscriptSizing="dynamic">
                    <mat-label>Apertura</mat-label>
                    <mat-select formControlName="open">
                      @for (time of TIME_OPTIONS; track time) {
                        <mat-option [value]="time">{{ time }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <span class="text-muted-foreground hidden px-1 text-lg md:block">-</span>

                  <mat-form-field class="w-full" subscriptSizing="dynamic">
                    <mat-label>Cierre</mat-label>
                    <mat-select formControlName="close">
                      @for (time of TIME_OPTIONS; track time) {
                        <mat-option [value]="time">{{ time }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              }
            </div>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Sitio Web</h2>

            <div class="grid grid-cols-1 gap-4" formGroupName="website">
              <mat-form-field>
                <mat-label>Dominio</mat-label>
                <input matInput formControlName="domain" placeholder="tuttoalena.com" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>URL del sitio web</mat-label>
                <input matInput formControlName="url" placeholder="https://tuttoalena.com" />
              </mat-form-field>
            </div>
          </section>
        </div>
      </form>
    }
  `,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
})
export class GeneralInfoPage {
  businessService = inject(BusinessService)
  private snackbar = inject(MatSnackBar)

  private formBuilder = inject(FormBuilder)
  private autoWebsiteUrl = true

  readonly DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
  readonly TIME_OPTIONS = this.generateTimeOptions()

  form = this.formBuilder.nonNullable.group({
    name: [''],
    description: [''],
    priceRange: [''],
    foundedYear: [new Date().getFullYear()],
    hours: this.formBuilder.nonNullable.group({
      Lunes: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Martes: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Miércoles: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Jueves: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Viernes: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Sábado: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
      Domingo: this.formBuilder.nonNullable.group({ open: ['00:00'], close: ['00:00'] }),
    }),
    website: this.formBuilder.nonNullable.group({
      domain: [''],
      url: [''],
    }),
  })

  constructor() {
    const domainControl = this.form.controls.website.controls.domain
    const urlControl = this.form.controls.website.controls.url

    domainControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((domain) => {
      if (!this.autoWebsiteUrl) {
        return
      }

      urlControl.setValue(this.buildUrlFromDomain(domain), { emitEvent: false })
    })

    urlControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((url) => {
      const expectedUrl = this.buildUrlFromDomain(domainControl.value)
      this.autoWebsiteUrl = url.trim() === '' || url === expectedUrl
    })

    effect(() => {
      const business = this.businessService.businessData()

      if (!business) {
        return
      }

      this.form.setValue(this.mapBusinessToFormValue(business))
      this.autoWebsiteUrl = this.isAutoWebsiteUrlEnabled()
    })
  }

  readonly YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).reverse()

  private mapBusinessToFormValue(business: Business) {
    return {
      name: business.name,
      description: business.description,
      priceRange: business.priceRange,
      foundedYear: business.foundedYear,
      hours: {
        Lunes: {
          open: this.normalizeTimeString(business.hours.Lunes.open),
          close: this.normalizeTimeString(business.hours.Lunes.close),
        },
        Martes: {
          open: this.normalizeTimeString(business.hours.Martes.open),
          close: this.normalizeTimeString(business.hours.Martes.close),
        },
        Miércoles: {
          open: this.normalizeTimeString(business.hours.Miércoles.open),
          close: this.normalizeTimeString(business.hours.Miércoles.close),
        },
        Jueves: {
          open: this.normalizeTimeString(business.hours.Jueves.open),
          close: this.normalizeTimeString(business.hours.Jueves.close),
        },
        Viernes: {
          open: this.normalizeTimeString(business.hours.Viernes.open),
          close: this.normalizeTimeString(business.hours.Viernes.close),
        },
        Sábado: {
          open: this.normalizeTimeString(business.hours.Sábado.open),
          close: this.normalizeTimeString(business.hours.Sábado.close),
        },
        Domingo: {
          open: this.normalizeTimeString(business.hours.Domingo.open),
          close: this.normalizeTimeString(business.hours.Domingo.close),
        },
      },
      website: {
        domain: business.website.domain,
        url: business.website.url,
      },
    }
  }

  private normalizeTimeString(value: string): string {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value)

    if (!match) {
      return '00:00'
    }

    const hours = Number(match[1])
    const minutes = Number(match[2])

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return '00:00'
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  private generateTimeOptions(): string[] {
    const options: string[] = []

    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
      }
    }

    return options
  }

  private buildUrlFromDomain(domain: string): string {
    const normalizedDomain = domain.trim()

    if (!normalizedDomain) {
      return ''
    }

    if (/^https?:\/\//i.test(normalizedDomain)) {
      return normalizedDomain
    }

    return `https://${normalizedDomain}`
  }

  private isAutoWebsiteUrlEnabled(): boolean {
    const domain = this.form.controls.website.controls.domain.value
    const url = this.form.controls.website.controls.url.value

    return url.trim() === '' || url === this.buildUrlFromDomain(domain)
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
      name: formValue.name,
      description: formValue.description,
      priceRange: formValue.priceRange,
      foundedYear: formValue.foundedYear,
      hours: formValue.hours,
      website: formValue.website,
    }

    this.businessService
      .saveBusinessData(updatedBusiness)
      .then(() => {
        this.form.markAsPristine()
        this.snackbar.open('Información del negocio actualizada exitosamente', 'Cerrar', {
          duration: 3000,
        })
      })
      .catch((error: unknown) => {
        this.snackbar.open((error as Error).message || 'Error al guardar los cambios, contacte al soporte', 'Cerrar', {
          duration: 5000,
        })
      })
  }
}
