import { DatePipe } from '@angular/common'
import { Component, computed, effect, inject, signal } from '@angular/core'
import { MatListModule } from '@angular/material/list'
import type { MatSnackBarRef } from '@angular/material/snack-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { PublishingSnackbarComponent } from '../components/snackbars/publishing.component'
import { BuildService } from '../services/build.service'
import { InfoService } from '../services/info.service'
import { SaveService } from '../services/save.service'

interface RouteInfo {
  label: string
  path: string
  icon: string
}

interface SectionInfo {
  label: string
  routes: RouteInfo[]
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="grid h-screen grid-cols-[auto_1fr] grid-rows-[auto_1fr]">
      <header class="col-span-2 border-b">
        <div class="container mx-auto flex items-center justify-between p-4">
          <a routerLink="/dashboard" class="flex items-center gap-2">
            <img src="logo.png" alt="Logo" class="w-18" />
            <div class="inline-flex flex-col items-start">
              <h1 class="font-display text-2xl font-bold">
                Tutto a Leña <strong class="text-primary font-handwriting text-glow">CMS</strong>
              </h1>
              <p class="text-muted-foreground">Sistema de Gestión de Contenidos</p>
            </div>
          </a>
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
              [class]="statusClass()"
            >
              {{ publishLabel() }}
            </span>
            <button class="button" [disabled]="isPublishDisabled()" (click)="onPublish()">Publicar Cambios</button>
          </div>
        </div>
      </header>
      <aside class="border-r">
        <nav>
          <mat-action-list>
            @for (section of ROUTES; track section.label) {
              <h3 mat-subheader class="px-3!">{{ section.label }}</h3>
              @for (route of section.routes; track route.path) {
                <a
                  mat-list-item
                  [routerLink]="route.path"
                  routerLinkActive="bg-white/10! is-active"
                  class="hover:text-accent! group pr-6! pl-4!"
                >
                  <i class="mat-icon group-[.is-active]:text-primary!" matListItemIcon> {{ route.icon }}</i>
                  <span matListItemTitle class="group-hover:text-accent! group-[.is-active]:text-primary!">
                    {{ route.label }}
                  </span>
                </a>
              }
            }
          </mat-action-list>
        </nav>
      </aside>
      <div class="grid grid-rows-[1fr_auto] overflow-y-auto">
        <main class="p-6">
          <router-outlet />
        </main>
        <footer class="bg-popover text-muted-foreground flex flex-col gap-2 p-4 text-xs">
          <div class="container mx-auto flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 text-sm">
              <img src="logo.png" alt="Logo" class="w-8" />
              <p class="font-semibold">Tutto A Leña CMS</p>
              <p>© {{ info.currentYear }} Mateo Manchola. Todos los derechos reservados.</p>
            </div>
            <div class="flex items-center gap-2">
              <p>v{{ info.appVersion }}</p>
              <span>•</span>
              <p>Angular {{ info.angularVersion }}</p>
              <span>•</span>
              <p>Firebase {{ info.firebaseVersion }}</p>
            </div>
          </div>
          <div class="container mx-auto flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <p>Sistema de gestión de contenidos para landing page</p>
              <span>•</span>
              <p>Desarrollado con Angular y Firebase</p>
            </div>
            <div class="flex items-center gap-2">
              <p>Última actualización: {{ saveService.lastUpdate() | date: 'short' }}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  `,
  imports: [RouterOutlet, RouterLink, MatListModule, RouterLinkActive, DatePipe],
})
export class DashboardPage {
  info = inject(InfoService)
  saveService = inject(SaveService)
  buildService = inject(BuildService)

  status = computed(() => this.buildService.current()?.status ?? 'unknown')

  private prevStatus: string | null = null
  private didInitialStatusCheck = false
  private _forcePublishingUi$ = signal(false)

  private uiStatus = computed(() => {
    if (this._forcePublishingUi$()) {
      return 'publishing'
    }

    return this.status()
  })

  private snackbar = inject(MatSnackBar)

  private loadingRef: MatSnackBarRef<PublishingSnackbarComponent> | null = null

  constructor() {
    effect(() => {
      const s = this.status()

      if (!this.didInitialStatusCheck) {
        this.didInitialStatusCheck = true
        this.prevStatus = s

        if (s === 'publishing') {
          this.loadingRef ??= this.snackbar.openFromComponent(PublishingSnackbarComponent, {
            duration: 0,
          })
        }

        return
      }

      if (s !== 'publishing') {
        this._forcePublishingUi$.set(false)
        this.loadingRef?.dismiss()
        this.loadingRef = null
      }

      if (this.prevStatus === s) return

      this.prevStatus = s

      switch (s) {
        case 'published':
          this.snackbar.open('Publicación completada', 'Cerrar')
          break
        case 'failed':
          this.snackbar.open('Publicación fallida', 'Cerrar')
          break
      }
    })
  }

  isPublishDisabled() {
    const status = this.uiStatus()

    if (status === 'publishing') {
      return true
    }

    if (status === 'failed') {
      return false
    }

    return this.saveService.isChangesSaved()
  }

  publishLabel() {
    const status = this.uiStatus()

    if (!this.saveService.isChangesSaved() && status !== 'failed') return 'Borrador'
    if (status === 'publishing') return 'Publicando'
    if (status === 'published') return 'Publicado'
    if (status === 'failed') return 'Fallido'
    return 'En espera'
  }

  statusClass() {
    const status = this.uiStatus()

    if (!this.saveService.isChangesSaved() && status !== 'failed') return 'bg-white/10 text-foreground border-white/10'
    if (status === 'publishing') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    if (status === 'published') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    if (status === 'failed') return 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    return 'bg-white/10 text-foreground border-white/10'
  }

  async onPublish() {
    try {
      await this.saveService.saveChanges()
      const startedRef = this.snackbar.open('Publicación iniciada correctamente', 'Cerrar', {
        duration: 3000,
      })

      startedRef.afterDismissed().subscribe(() => {
        this._forcePublishingUi$.set(true)
        this.loadingRef ??= this.snackbar.openFromComponent(PublishingSnackbarComponent, {
          duration: 0,
        })
      })
    } catch (error: unknown) {
      this.snackbar.open((error as Error).message || 'No se pudo iniciar la publicación', 'Cerrar', {
        duration: 5000,
      })
    }
  }

  ROUTES: SectionInfo[] = [
    {
      label: 'Negocio',
      routes: [
        { label: 'Información general', path: 'general-info', icon: 'info' },
        { label: 'Datos de contacto', path: 'contact-info', icon: 'phone' },
      ],
    },
    {
      label: 'Contenido',
      routes: [
        { label: 'Carta', path: 'menu', icon: 'restaurant_menu' },
        { label: 'Eventos', path: 'events', icon: 'event' },
        { label: 'Galería', path: 'gallery', icon: 'photo' },
      ],
    },
  ]
}
