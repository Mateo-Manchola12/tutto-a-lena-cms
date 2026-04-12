import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatTooltipModule } from '@angular/material/tooltip'
import type { GalleryImageFormGroup } from '../gallery-form.types'

@Component({
  selector: 'app-gallery-image-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonToggleModule, MatTooltipModule],
  template: `
    <div class="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <!-- Thumbnail -->
      <div class="overflow-hidden rounded-xl">
        <img
          [src]="control.value.src"
          [alt]="control.value.alt ?? ''"
          class="h-48 w-full object-cover"
          loading="lazy"
        />
      </div>

      <!-- Alt text -->
      <div class="flex flex-col gap-1" [formGroup]="control">
        <label class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Texto alternativo (alt)
        </label>
        <input
          formControlName="alt"
          type="text"
          placeholder="Describe la imagen para accesibilidad y SEO"
          class="focus:border-primary/60 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <!-- Description -->
      <div class="flex flex-col gap-1" [formGroup]="control">
        <label class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Descripción (overlay en hover)
        </label>
        <textarea
          formControlName="description"
          rows="3"
          placeholder="Texto que aparece al pasar el ratón sobre la foto"
          class="focus:border-primary/60 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
        ></textarea>
      </div>

      <!-- Featured toggle -->
      <div class="flex items-center justify-between" [formGroup]="control">
        <div>
          <p class="text-sm font-medium">Destacada en Home</p>
          <p class="text-muted-foreground text-xs">Aparece en la sección de galería de la portada</p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors focus:outline-none"
          [class.bg-primary]="control.value.featured"
          [class.bg-white/20]="!control.value.featured"
          (click)="control.controls.featured.setValue(!control.value.featured)"
        >
          <span
            class="inline-block size-5 translate-x-0.5 translate-y-0.5 rounded-full bg-white shadow transition-transform"
            [class.translate-x-5!]="control.value.featured"
          ></span>
        </button>
      </div>

      <!-- Span controls -->
      <div class="flex flex-col gap-3">
        <p class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Tamaño en el grid</p>

        <!-- Breakpoint rows -->
        @for (bp of breakpoints; track bp.key) {
          <div class="rounded-lg border border-white/10 bg-white/5 p-3">
            <p class="text-muted-foreground mb-2 text-xs">{{ bp.label }}</p>
            <div class="flex gap-3">
              <!-- colSpan -->
              <div class="flex flex-1 flex-col gap-1" [formGroup]="control.controls.colSpan">
                <p class="text-muted-foreground text-xs">Ancho</p>
                <mat-button-toggle-group [formControlName]="bp.key" class="w-full">
                  <mat-button-toggle [value]="1" class="flex-1 text-xs">1 col</mat-button-toggle>
                  <mat-button-toggle [value]="2" class="flex-1 text-xs">2 cols</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
              <!-- rowSpan -->
              <div class="flex flex-1 flex-col gap-1" [formGroup]="control.controls.rowSpan">
                <p class="text-muted-foreground text-xs">Alto</p>
                <mat-button-toggle-group [formControlName]="bp.key" class="w-full">
                  <mat-button-toggle [value]="1" class="flex-1 text-xs">1 fila</mat-button-toggle>
                  <mat-button-toggle [value]="2" class="flex-1 text-xs">2 filas</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="mt-auto flex gap-2 pt-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
          (click)="editorClose.emit()"
        >
          <i class="mat-icon text-base">close</i>
          Cerrar
        </button>
        <button
          type="button"
          matTooltip="{{
            control.value.storagePath
              ? 'Eliminar foto de Storage y galería'
              : 'No se puede eliminar: es una imagen demo'
          }}"
          matTooltipPosition="above"
          class="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
          (click)="editorDelete.emit()"
        >
          <i class="mat-icon text-base">delete</i>
          Eliminar
        </button>
      </div>
    </div>
  `,
})
export class GalleryImageEditorComponent {
  @Input({ required: true }) control!: GalleryImageFormGroup
  @Output() readonly editorClose = new EventEmitter<void>()
  @Output() readonly editorDelete = new EventEmitter<void>()

  readonly breakpoints: { key: 'default' | 'sm' | 'md'; label: string }[] = [
    { key: 'default', label: '📱 Mobile (< 640px) · 2 columnas' },
    { key: 'sm', label: '🖥️ Tablet (≥ 640px) · 3 columnas' },
    { key: 'md', label: '💻 Desktop (≥ 768px) · 4 columnas' },
  ]
}
