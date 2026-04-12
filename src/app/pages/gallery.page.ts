import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop'
import type { CdkDragDrop } from '@angular/cdk/drag-drop'
import type { GalleryImage } from '../../types/gallery'
import type { GalleryFormArray, GalleryImageFormGroup, ActiveBreakpoint } from './gallery/gallery-form.types'
import { GalleryService } from '../services/gallery.service'
import { GalleryImageEditorComponent } from './gallery/components/gallery-image-editor.component'

const PREVIEW_COLS: Record<ActiveBreakpoint, number> = {
  default: 2,
  sm: 3,
  md: 4,
}
const BREAKPOINT_LABEL: Record<ActiveBreakpoint, string> = {
  default: '📱 Mobile · 2 cols',
  sm: '🖥️ Tablet · 3 cols',
  md: '💻 Desktop · 4 cols',
}
const PREVIEW_WIDTH: Record<ActiveBreakpoint, string> = {
  default: '375px',
  sm: '680px',
  md: '100%',
}

// Imágenes de ejemplo (14 fotos de public/images/).
// storagePath vacío: al eliminar no borra nada en Storage.
// TODO: Eliminar este botón cuando el cliente suba sus fotos reales.
const SAMPLE_IMAGES: Omit<GalleryImage, 'id' | 'rotate' | 'order'>[] = [
  { src: '/images/oven-mosaic-front-face.jpg', storagePath: '', alt: 'Horno de leña con mosaico frontal', description: 'Nuestro hermoso horno artesanal', colSpan: { default: 2, sm: 2, md: 2 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/hero-food-truck.jpg', storagePath: '', alt: 'Food truck Tutto a Leña', description: 'Nuestro icónico food truck donde todo comenzó', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/chef-puttin-pizza-in-oven.jpg', storagePath: '', alt: 'Chef colocando pizza en horno de leña', description: 'El arte de hornear en fuego real', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/vertical-full-pizza.jpg', storagePath: '', alt: 'Pizza completa recién horneada', description: 'Perfección recién salida del horno', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/empanada-realy-good-looking.jpg', storagePath: '', alt: 'Empanadas artesanales', description: 'Empanadas doradas y crujientes', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/pizza-slice-cool-photo.jpg', storagePath: '', alt: 'Porción de pizza', description: 'Cada porción es una obra de arte', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: true },
  { src: '/images/oven-inside-fire-pizza.jpg', storagePath: '', alt: 'Interior del horno con fuego y pizza', description: 'El corazón de nuestra cocina', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 1, sm: 1, md: 1 }, featured: false },
  { src: '/images/pizza-and-beer.jpg', storagePath: '', alt: 'Pizza y cerveza', description: 'La combinación perfecta', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
  { src: '/images/serving-beer.jpg', storagePath: '', alt: 'Sirviendo cerveza tirada', description: 'Cerveza artesanal bien fría', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
  { src: '/images/oven-mosaic.jpg', storagePath: '', alt: 'Horno de leña decorado', description: 'Diseño único en cada detalle', colSpan: { default: 2, sm: 2, md: 2 }, rowSpan: { default: 1, sm: 1, md: 1 }, featured: false },
  { src: '/images/empanada.jpg', storagePath: '', alt: 'Empanada individual', description: 'Detalle de nuestra empanada artesanal', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
  { src: '/images/empanada-and-beer.jpg', storagePath: '', alt: 'Empanadas con cerveza', description: 'Snack perfecto para compartir', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
  { src: '/images/3-dessert-piramid.jpg', storagePath: '', alt: 'Pirámide de postres', description: 'Dulce final para tu experiencia', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
  { src: '/images/pizza-and-beer2.jpg', storagePath: '', alt: 'Pizza y cerveza en mesa', description: 'Momentos para disfrutar', colSpan: { default: 1, sm: 1, md: 1 }, rowSpan: { default: 2, sm: 2, md: 2 }, featured: false },
]

@Component({
  selector: 'app-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatTooltipModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    GalleryImageEditorComponent,
  ],
  styles: [`
    :host { display: block; }
    .grid-preview {
      display: grid;
      gap: 8px;
      grid-auto-rows: 160px;
      transition: grid-template-columns 0.3s ease;
    }
    .grid-item {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      cursor: pointer;
      transition: outline 0.15s ease;
    }
    .grid-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
      user-select: none;
    }
    .cdk-drag-placeholder {
      opacity: 0.4;
      border: 2px dashed rgba(255,255,255,0.3);
      border-radius: 12px;
    }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .cdk-drop-list-dragging .grid-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0,0,0.2,1);
    }
  `],
  template: `
    @if (galleryService.loading()) {
      <div class="flex h-full w-full items-center justify-center">
        <div class="border-primary size-20 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    } @else {
      <div class="relative mx-auto flex max-w-screen-xl flex-col gap-6 pb-10">
        <div class="from-primary/10 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br via-transparent to-transparent blur-3xl"></div>

        <!-- ===== HEADER ===== -->
        <header class="from-surface-light to-surface/80 rounded-2xl border border-white/10 bg-linear-to-br p-6 shadow-xl">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="font-display text-3xl font-bold leading-tight lg:text-4xl">Galería</h1>
              <p class="text-muted-foreground max-w-2xl text-sm">
                Sube fotos, ajusta su tamaño en el grid y define qué images aparecen en la portada.
                Cambia el breakpoint para previsualizar cómo se verá en móvil, tablet y escritorio.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Status badge -->
              <span class="bg-primary/15 text-primary border-primary/30 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
                @if (uploadingCount() > 0) {
                  <i class="mat-icon mr-1 text-sm leading-none">upload</i>
                  Subiendo {{ uploadingCount() }} foto{{ uploadingCount() > 1 ? 's' : '' }}…
                } @else if (form.dirty) {
                  <i class="mat-icon mr-1 text-sm leading-none">check_circle</i>
                  Borrador listo
                } @else {
                  <i class="mat-icon mr-1 text-sm leading-none">check</i>
                  Sin cambios
                }
              </span>

              <!-- Breakpoint switcher -->
              <mat-button-toggle-group
                [value]="activeBreakpoint()"
                (change)="activeBreakpoint.set($event.value)"
              >
                @for (bp of breakpointKeys; track bp) {
                  <mat-button-toggle [value]="bp" class="text-xs">
                    {{ breakpointLabel[bp] }}
                  </mat-button-toggle>
                }
              </mat-button-toggle-group>

              <!-- Upload button -->
              <button
                type="button"
                class="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-4 text-sm hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="uploadingCount() > 0"
                (click)="fileInput.click()"
              >
                <i class="mat-icon text-base">add_photo_alternate</i>
                Añadir fotos
              </button>
              <input
                #fileInput
                type="file"
                multiple
                accept="image/*"
                class="hidden"
                (change)="onAddFiles($event)"
              />

              <!-- Seed button — TODO: eliminar cuando el cliente suba sus fotos reales -->
              @if (form.length === 0 && uploadingCount() === 0) {
                <button
                  type="button"
                  matTooltip="Carga las 14 fotos de ejemplo del sitio (no usan Firebase Storage)"
                  matTooltipPosition="above"
                  class="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 text-sm text-amber-300 hover:bg-amber-500/20 transition-colors"
                  (click)="seedGallery()"
                >
                  <i class="mat-icon text-base">auto_stories</i>
                  Cargar ejemplos
                </button>
              }

              <!-- Save button -->
              <button
                class="button min-w-44"
                type="button"
                (click)="onSave()"
                [disabled]="!form.dirty || uploadingCount() > 0"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </header>

        <!-- ===== UPLOAD PROGRESS ===== -->
        @if (uploadingCount() > 0) {
          <div class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg">
            <h2 class="mb-3 text-sm font-semibold">Subiendo imágenes…</h2>
            <div class="flex flex-col gap-3">
              @for (entry of activeUploads().entries(); track entry[0]) {
                <div class="flex items-center gap-3">
                  <span class="w-40 truncate text-xs text-muted-foreground">{{ entry[0] }}</span>
                  <mat-progress-bar mode="determinate" [value]="entry[1]" class="flex-1"></mat-progress-bar>
                  <span class="w-10 text-right text-xs text-muted-foreground">{{ entry[1] }}%</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ===== MAIN AREA ===== -->
        <div class="flex gap-5">
          <!-- Preview Panel -->
          <div class="from-surface-light to-surface flex-1 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg">
            <!-- Viewport sizing indicator -->
            <div class="mb-4 flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Vista previa:</span>
              <span class="rounded bg-white/10 px-2 py-0.5 text-xs font-mono">{{ previewWidth() }}</span>
              <span class="text-xs text-muted-foreground">· {{ activeCols() }} columnas · filas de 160px</span>
            </div>

            <!-- Constrained width preview -->
            <div
              class="mx-auto overflow-hidden rounded-xl border border-white/10 transition-all duration-300"
              [style.max-width]="previewWidth()"
            >
              @if (form.length === 0) {
                <div class="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/10 p-16 text-center">
                  <i class="mat-icon text-primary text-5xl">add_photo_alternate</i>
                  <div class="space-y-1">
                    <h3 class="text-xl font-semibold">Galería vacía</h3>
                    <p class="text-muted-foreground max-w-xs text-sm">
                      Añade fotos con el botón "Añadir fotos" o carga los ejemplos para ver el resultado.
                    </p>
                  </div>
                </div>
              } @else {
                <div
                  class="grid-preview"
                  [style.grid-template-columns]="'repeat(' + activeCols() + ', 1fr)'"
                  cdkDropList
                  cdkDropListOrientation="mixed"
                  (cdkDropListDropped)="onDrop($event)"
                >
                  @for (ctrl of form.controls; track ctrl.value.id; let i = $index) {
                    <div
                      class="grid-item"
                      [class.outline]="selectedIndex() === i"
                      [class.outline-primary]="selectedIndex() === i"
                      [class.outline-2]="selectedIndex() === i"
                      [style.grid-column]="'span ' + getColSpan(ctrl)"
                      [style.grid-row]="'span ' + getRowSpan(ctrl)"
                      [style.transform]="'rotate(' + ctrl.value.rotate + 'deg)'"
                      (click)="selectedIndex.set(i)"
                      cdkDrag
                      [cdkDragData]="i"
                    >
                      <img [src]="ctrl.value.src" [alt]="ctrl.value.alt ?? ''" loading="lazy" />

                      <!-- Drag handle -->
                      <div
                        class="absolute left-2 top-2 flex size-7 cursor-grab items-center justify-center rounded-full bg-black/50 text-white opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                        cdkDragHandle
                      >
                        <i class="mat-icon text-sm">drag_indicator</i>
                      </div>

                      <!-- Featured badge -->
                      @if (ctrl.value.featured) {
                        <div class="absolute right-2 top-2 rounded-full bg-primary/80 px-2 py-0.5 text-xs text-white">
                          ★ Home
                        </div>
                      }

                      <!-- Order number -->
                      <div class="absolute bottom-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white font-bold">
                        {{ i + 1 }}
                      </div>

                      <!-- Drag placeholder -->
                      <div *cdkDragPlaceholder class="absolute inset-0 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5"></div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Sidebar Editor -->
          @if (selectedIndex() !== null && selectedCtrl()) {
            <div class="from-surface-light to-surface w-72 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b shadow-lg">
              <app-gallery-image-editor
                [control]="selectedCtrl()!"
                (editorClose)="selectedIndex.set(null)"
                (editorDelete)="onDeleteImage(selectedIndex()!)"
              />
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class GalleryPage {
  protected readonly galleryService = inject(GalleryService)
  private readonly fb = inject(FormBuilder)
  private readonly snackBar = inject(MatSnackBar)
  private readonly cdr = inject(ChangeDetectorRef)

  readonly breakpointKeys: ActiveBreakpoint[] = ['default', 'sm', 'md']
  readonly breakpointLabel = BREAKPOINT_LABEL

  readonly activeBreakpoint = signal('default' as ActiveBreakpoint)
  readonly selectedIndex = signal<number | null>(null)
  readonly activeUploads = signal(new Map<string, number>())

  readonly uploadingCount = computed(() => this.activeUploads().size)
  readonly activeCols = computed(() => PREVIEW_COLS[this.activeBreakpoint()])
  readonly previewWidth = computed(() => PREVIEW_WIDTH[this.activeBreakpoint()])
  readonly selectedCtrl = computed<GalleryImageFormGroup | null>(() => {
    const i = this.selectedIndex()
    return i !== null ? (this.form.controls[i] ?? null) : null
  })

  readonly form = (this.fb.array([]) as unknown) as GalleryFormArray

  constructor() {
    // Hydrate form once service data is ready
    const checkData = () => {
      const data = this.galleryService.galleryData()
      if (data) {
        data.images.forEach((img) => {
          this.form.push(this.createImageFormGroup(img), { emitEvent: false })
        })
        this.form.markAsPristine()
        this.cdr.markForCheck()
      } else if (!this.galleryService.loading()) {
        // loading finished but no data → empty gallery, already good
      } else {
        setTimeout(checkData, 100)
      }
    }
    checkData()
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  createImageFormGroup(img: GalleryImage): GalleryImageFormGroup {
    return this.fb.group({
      id: this.fb.nonNullable.control(img.id),
      src: this.fb.nonNullable.control(img.src),
      storagePath: this.fb.nonNullable.control(img.storagePath),
      alt: this.fb.nonNullable.control(img.alt),
      description: this.fb.nonNullable.control(img.description),
      colSpan: this.fb.group({
        default: this.fb.nonNullable.control(img.colSpan.default),
        sm: this.fb.nonNullable.control(img.colSpan.sm),
        md: this.fb.nonNullable.control(img.colSpan.md),
      }),
      rowSpan: this.fb.group({
        default: this.fb.nonNullable.control(img.rowSpan.default),
        sm: this.fb.nonNullable.control(img.rowSpan.sm),
        md: this.fb.nonNullable.control(img.rowSpan.md),
      }),
      rotate: this.fb.nonNullable.control(img.rotate),
      featured: this.fb.nonNullable.control(img.featured),
      order: this.fb.nonNullable.control(img.order),
    }) as GalleryImageFormGroup
  }

  getColSpan(ctrl: GalleryImageFormGroup): number {
    return ctrl.value.colSpan?.[this.activeBreakpoint()] ?? 1
  }

  getRowSpan(ctrl: GalleryImageFormGroup): number {
    return ctrl.value.rowSpan?.[this.activeBreakpoint()] ?? 1
  }

  syncOrderValues() {
    this.form.controls.forEach((ctrl, i) => {
      ctrl.controls.order.setValue(i, { emitEvent: false })
    })
  }

  // ─── event handlers ─────────────────────────────────────────────────────────

  onAddFiles(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = '' // allow re-selecting same file

    files.forEach((file) => {
      const fileId = file.name
      const uploads = new Map(this.activeUploads())
      uploads.set(fileId, 0)
      this.activeUploads.set(uploads)

      const { progress$ } = this.galleryService.uploadImage(file)

      progress$.subscribe({
        next: ({ percent, url, storagePath }) => {
          const map = new Map(this.activeUploads())
          map.set(fileId, percent)
          this.activeUploads.set(map)

          if (url && storagePath) {
            const newImg: GalleryImage = {
              id: crypto.randomUUID(),
              src: url,
              storagePath,
              alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
              description: '',
              colSpan: { default: 1, sm: 1, md: 1 },
              rowSpan: { default: 2, sm: 2, md: 2 },
              rotate: Math.floor(Math.random() * 7) - 3,
              featured: false,
              order: this.form.length,
            }
            this.form.push(this.createImageFormGroup(newImg))
            this.syncOrderValues()
            this.form.markAsDirty()
          }
          this.cdr.markForCheck()
        },
        error: () => {
          const map = new Map(this.activeUploads())
          map.delete(fileId)
          this.activeUploads.set(map)
          this.snackBar.open(`Error al subir ${file.name}`, 'Cerrar')
          this.cdr.markForCheck()
        },
        complete: () => {
          const map = new Map(this.activeUploads())
          map.delete(fileId)
          this.activeUploads.set(map)
          this.cdr.markForCheck()
        },
      })
    })
  }

  onDrop(event: CdkDragDrop<number>) {
    moveItemInArray(this.form.controls, event.previousIndex, event.currentIndex)
    this.syncOrderValues()
    this.form.markAsDirty()

    // Update selected index to follow the moved item
    const si = this.selectedIndex()
    if (si !== null) {
      if (si === event.previousIndex) {
        this.selectedIndex.set(event.currentIndex)
      } else if (si > event.previousIndex && si <= event.currentIndex) {
        this.selectedIndex.set(si - 1)
      } else if (si < event.previousIndex && si >= event.currentIndex) {
        this.selectedIndex.set(si + 1)
      }
    }
  }

  onDeleteImage(index: number) {
    const ctrl = this.form.controls[index]
    const storagePath = ctrl.value.storagePath
    if (storagePath) {
      void this.galleryService.deleteImage(storagePath).catch(() => {
        this.snackBar.open('No se pudo eliminar la imagen de Storage', 'Cerrar')
      })
    }

    this.form.removeAt(index)
    this.syncOrderValues()
    this.selectedIndex.set(null)
    this.form.markAsDirty()
  }

  async onSave() {
    if (!this.form.dirty || this.uploadingCount() > 0) return

    try {
      const images = this.form.getRawValue() as GalleryImage[]
      await this.galleryService.saveGalleryData({ images })
      this.form.markAsPristine()
      this.snackBar.open('Galería guardada correctamente ✓')
    } catch {
      this.snackBar.open('Error al guardar la galería', 'Cerrar')
    }
  }

  seedGallery() {
    SAMPLE_IMAGES.forEach((img, i) => {
      const rotate = Math.floor(Math.random() * 7) - 3
      this.form.push(
        this.createImageFormGroup({ ...img, id: crypto.randomUUID(), rotate, order: i }),
        { emitEvent: false },
      )
    })
    this.syncOrderValues()
    this.form.markAsDirty()
    this.snackBar.open(
      '14 imágenes de ejemplo cargadas — guarda los cambios para publicar.',
      'OK',
      { duration: 6000 },
    )
  }
}
