import { DatePipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatListModule } from '@angular/material/list'
import { MatSnackBar } from '@angular/material/snack-bar'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
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
  private snackbar = inject(MatSnackBar)

  isPublishDisabled() {
    const status = this.buildService.current()?.status

    if (status === 'publishing') {
      return true
    }

    if (status === 'failed') {
      return false
    }

    return this.saveService.isChangesSaved()
  }

  publishLabel() {
    const status = this.buildService.current()?.status

    if (status === 'publishing') return 'Publicando'
    if (status === 'published') return 'Publicado'
    if (status === 'failed') return 'Fallido'
    return 'En espera'
  }

  statusClass() {
    const status = this.buildService.current()?.status

    if (status === 'publishing') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    if (status === 'published') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    if (status === 'failed') return 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    return 'bg-white/10 text-foreground border-white/10'
  }

  async onPublish() {
    try {
      await this.saveService.saveChanges()
      this.snackbar.open('Publicación iniciada correctamente', 'Cerrar', {
        duration: 3000,
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
