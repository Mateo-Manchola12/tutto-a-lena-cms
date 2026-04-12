import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import type { FormControl } from '@angular/forms'
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import type { MatChipInputEvent } from '@angular/material/chips'
import { MatDialog } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import { firstValueFrom, startWith } from 'rxjs'
import { MenuService } from '../services/menu.service'
import { ConfirmActionDialogComponent } from './menu/components/confirm-action-dialog.component'
import { MenuCategoryEditorComponent } from './menu/components/menu-category-editor.component'
import type {
  CategoryFormGroup,
  MenuCategoryEditorActions,
  MenuFormGroup,
  MenuProductEditorActions,
  ProductFormGroup,
  TagFormGroup,
} from './menu/menu-form.types'

@Component({
  selector: 'app-menu',
  template: `
    @if (menuService.loading()) {
      <div class="flex h-full w-full items-center justify-center">
        <div
          class="border-primary border-r-primary-active size-20 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
      </div>
    } @else if (menuService.menuData()) {
      <form class="relative mx-auto flex max-w-7xl flex-col gap-6 pb-10" [formGroup]="form">
        <div
          class="from-primary/10 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br via-transparent to-transparent blur-3xl"
        ></div>

        <header
          class="from-surface-light to-surface/80 rounded-2xl border border-white/10 bg-linear-to-br p-6 shadow-xl"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="font-display text-3xl leading-tight font-bold lg:text-4xl">Carta</h1>
              <p class="text-muted-foreground max-w-2xl text-sm">
                Crea y gestiona categorías, platos y etiquetas desde una sola pantalla.
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
        <div class="flex flex-col items-stretch gap-5">
          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Categorías</h2>
            <mat-accordion class="w-full">
              @for (category of form.controls.categories.controls; track category.value.id) {
                <app-menu-category-editor
                  [category]="category"
                  [productEditorActions]="productEditorActions"
                  [categoryActions]="categoryEditorActions"
                  [isExpanded]="expandedCategoryId() === category.controls.id.value"
                  [expandedProductId]="expandedProductByCategory()[category.controls.id.value] ?? null"
                />
              }

              <mat-expansion-panel #newCategoryPanel hideToggle (opened)="onAddCategory(newCategoryPanel)">
                <mat-expansion-panel-header>
                  <mat-panel-title>Nuevo</mat-panel-title>
                  <mat-panel-description>Agregar nueva categoría </mat-panel-description>
                  <i class="mat-icon">add</i>
                </mat-expansion-panel-header>
              </mat-expansion-panel>
            </mat-accordion>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <div class="mb-5 flex items-center justify-between gap-4">
              <h2 class="text-2xl font-bold">Etiquetas</h2>
              <button class="button" type="button" (click)="onAddTag()">Nueva etiqueta</button>
            </div>

            <mat-accordion class="w-full">
              @for (tag of form.controls.tags.controls; track tag.controls.id.value) {
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ tag.controls.emoji.value }} {{ tag.controls.name.value }}</mat-panel-title>
                    <mat-panel-description>{{ tag.controls.id.value }}</mat-panel-description>
                    <button
                      type="button"
                      class="m-2 flex cursor-pointer items-center justify-center rounded-md p-1 text-red-400 hover:bg-red-500/10"
                      aria-label="Eliminar etiqueta"
                      (click)="$event.stopPropagation(); onDeleteTag(tag)"
                    >
                      <i class="mat-icon">delete</i>
                    </button>
                  </mat-expansion-panel-header>

                  <div class="flex gap-4">
                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Nombre</mat-label>
                      <input matInput placeholder="Sin gluten" [formControl]="tag.controls.name" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full">
                      <mat-label>Emoji</mat-label>
                      <input matInput placeholder="🌱" [formControl]="tag.controls.emoji" />
                    </mat-form-field>
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </section>
        </div>
      </form>
    }
  `,
  imports: [ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MenuCategoryEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  readonly menuService = inject(MenuService)
  private formBuilder = inject(FormBuilder)
  private dialog = inject(MatDialog)
  private snackbar = inject(MatSnackBar)
  readonly menu = this.menuService.menuData
  readonly form: MenuFormGroup = new FormGroup({
    categories: new FormArray<CategoryFormGroup>([]),
    tags: new FormArray<TagFormGroup>([]),
  })
  readonly expandedCategoryId = signal<string | null>(null)
  readonly expandedProductByCategory = signal<Record<string, string | null>>({})
  private readonly formTagsValue = toSignal(
    this.form.controls.tags.valueChanges.pipe(startWith(this.form.controls.tags.getRawValue())),
    { initialValue: this.form.controls.tags.getRawValue() },
  )
  readonly allTags = computed(() =>
    this.formTagsValue().flatMap((tag) => {
      if (!tag.id || !tag.name) {
        return []
      }

      return [{ id: tag.id, name: tag.name }]
    }),
  )
  private readonly tagsById = computed(() => new Map(this.allTags().map((tag) => [tag.id, tag.name])))

  readonly productEditorActions: MenuProductEditorActions = {
    removeProduct: (menuItem) => {
      void this.deleteProduct(menuItem)
    },
    removeIngredient: (menuItem, ingredient) => {
      this.removeFromArray(menuItem.controls.ingredients, ingredient)
    },
    removeTag: (menuItem, tag) => {
      this.removeFromArray(menuItem.controls.tags, tag)
    },
    addIngredient: (menuItem, event) => {
      this.addToArray(menuItem.controls.ingredients, event)
    },
    selectedTag: (menuItem, event) => {
      const value = event.option.value as string
      if (menuItem.controls.tags.value.includes(value)) return

      menuItem.controls.tags.setValue([...menuItem.controls.tags.value, value])
    },
    getTagNameById: (tagId) => {
      return this.tagsById().get(tagId)
    },
    getTagsFiltered: (menuItem, text) => {
      const normalizedText = this.normalizeFilterText(text)

      return this.allTags().filter(
        (tag) => !menuItem.controls.tags.value.includes(tag.id) && tag.name.toLowerCase().includes(normalizedText),
      )
    },
  }

  readonly categoryEditorActions: MenuCategoryEditorActions = {
    removeCategory: (category) => {
      void this.deleteCategory(category)
    },
    addProduct: (category) => {
      this.addProduct(category)
    },
  }

  constructor() {
    effect(() => {
      const menu = this.menu()

      if (!menu) {
        return
      }

      this.buildForm(menu)
    })
  }

  private buildForm(menu: Menu) {
    this.form.controls.categories.clear()
    this.form.controls.tags.clear()

    for (const category of menu.categories) {
      this.form.controls.categories.push(this.getCategoryFormGroup(category))
    }

    for (const tag of menu.tags) {
      this.form.controls.tags.push(this.getTagFormGroup(tag))
    }

    this.expandedCategoryId.set(null)
    this.expandedProductByCategory.set({})
    this.form.markAsPristine()
  }

  private getCategoryFormGroup(category: MenuCategory): CategoryFormGroup {
    const fb = this.formBuilder.nonNullable

    return fb.group({
      id: fb.control(category.id),
      name: fb.control(category.name),
      description: fb.control(category.description),
      emoji: fb.control(category.emoji),
      products: fb.array(category.products.map((product) => this.getProductFormGroup(product))),
    })
  }

  private getProductFormGroup(product: MenuItem): ProductFormGroup {
    const fb = this.formBuilder.nonNullable

    return fb.group({
      id: fb.control(product.id),
      name: fb.control(product.name),
      description: fb.control(product.description),
      price: fb.control(product.price ?? null),
      ingredients: fb.control([...product.ingredients]),
      tags: fb.control([...product.tags]),
    })
  }

  private getTagFormGroup(tag: MenuTag): TagFormGroup {
    const fb = this.formBuilder.nonNullable

    return fb.group({
      id: fb.control(tag.id),
      name: fb.control(tag.name),
      emoji: fb.control(tag.emoji),
    })
  }

  onAddCategory(panel: { close: () => void }) {
    const id = this.generateCategoryId()

    this.form.controls.categories.push(
      this.getCategoryFormGroup({
        id,
        name: '',
        description: '',
        emoji: '🍽️',
        products: [],
      }),
    )
    this.expandedCategoryId.set(id)
    this.form.markAsDirty()
    panel.close()
  }

  onAddTag() {
    const id = this.generateTagId()

    this.form.controls.tags.push(
      this.getTagFormGroup({
        id,
        name: '',
        emoji: '🏷️',
      }),
    )
    this.form.markAsDirty()
  }

  async onDeleteTag(tag: TagFormGroup) {
    const confirmed = await this.confirmAction({
      title: 'Eliminar etiqueta',
      message: 'Esta acción quitará la etiqueta de todos los productos de forma local. ¿Deseas continuar?',
      confirmText: 'Eliminar',
    })

    if (!confirmed) return

    const index = this.form.controls.tags.controls.indexOf(tag)
    if (index < 0) return

    const tagId = tag.controls.id.value
    this.form.controls.tags.removeAt(index)

    for (const category of this.form.controls.categories.controls) {
      for (const product of category.controls.products.controls) {
        const currentTags = product.controls.tags.value
        const nextTags = currentTags.filter((value) => value !== tagId)

        if (nextTags.length !== currentTags.length) {
          product.controls.tags.setValue(nextTags)
        }
      }
    }

    this.form.markAsDirty()
  }

  onSave() {
    const formValue = this.form.getRawValue()

    this.menuService
      .saveMenuData(formValue)
      .then(() => {
        this.form.markAsPristine()
        this.snackbar.open('Menu actualizado exitosamente', 'Cerrar', {
          duration: 3000,
        })
      })
      .catch((error: unknown) => {
        this.snackbar.open((error as Error).message || 'Error al guardar los cambios, contacte al soporte', 'Cerrar', {
          duration: 5000,
        })
      })
  }

  private removeFromArray(control: FormControl<string[]>, value: string) {
    control.setValue(control.value.filter((i) => i !== value))
  }

  private addToArray(control: FormControl<string[]>, event: MatChipInputEvent) {
    const value = (event.value || '').trim().replace(/\s+/g, ' ')
    if (!value) return

    const current = control.value

    if (!current.some((i) => i.toLowerCase() === value.toLowerCase())) {
      control.setValue([...current, value])
    }

    event.chipInput.clear()
  }

  private normalizeFilterText(text?: string | null): string {
    return (text ?? '').trim().toLowerCase()
  }

  private addProduct(category: CategoryFormGroup) {
    const id = this.generateProductId()

    category.controls.products.push(
      this.getProductFormGroup({
        id,
        name: '',
        description: '',
        ingredients: [],
        tags: [],
        price: null,
      }),
    )

    this.expandedCategoryId.set(category.controls.id.value)
    this.expandedProductByCategory.update((current) => ({ ...current, [category.controls.id.value]: id }))
    this.form.markAsDirty()
  }

  private async deleteProduct(menuItem: ProductFormGroup) {
    const confirmed = await this.confirmAction({
      title: 'Eliminar producto',
      message: '¿Seguro que deseas eliminar este producto?',
      confirmText: 'Eliminar',
    })

    if (!confirmed) return

    for (const category of this.form.controls.categories.controls) {
      const index = category.controls.products.controls.indexOf(menuItem)

      if (index < 0) continue

      category.controls.products.removeAt(index)
      this.form.markAsDirty()
      return
    }
  }

  private async deleteCategory(category: CategoryFormGroup) {
    const confirmed = await this.confirmAction({
      title: 'Eliminar categoría',
      message: '¿Seguro que deseas eliminar esta categoría y sus productos?',
      confirmText: 'Eliminar',
    })

    if (!confirmed) return

    const index = this.form.controls.categories.controls.indexOf(category)
    if (index < 0) return

    this.form.controls.categories.removeAt(index)
    this.expandedProductByCategory.update((current) => {
      const next = { ...current }
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete next[category.controls.id.value]
      return next
    })
    if (this.expandedCategoryId() === category.controls.id.value) {
      this.expandedCategoryId.set(null)
    }
    this.form.markAsDirty()
  }

  private async confirmAction(data: { title: string; message: string; confirmText?: string }): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '420px',
      data,
    })

    return (await firstValueFrom(dialogRef.afterClosed())) === true
  }

  private generateCategoryId(): string {
    const existingIds = new Set(this.form.controls.categories.controls.map((category) => category.controls.id.value))
    return this.generateId('cat_', existingIds)
  }

  private generateProductId(): string {
    const existingIds = new Set(
      this.form.controls.categories.controls.flatMap((category) =>
        category.controls.products.controls.map((product) => product.controls.id.value),
      ),
    )
    return this.generateId('prd_', existingIds)
  }

  private generateTagId(): string {
    const existingIds = new Set(this.form.controls.tags.controls.map((tag) => tag.controls.id.value))
    return this.generateId('tag_', existingIds)
  }

  private generateId(prefix: string, existingIds: Set<string>): string {
    // eslint-disable-next-line no-useless-assignment
    let id = ''

    do {
      id = `${prefix}${Math.random().toString(36).slice(2, 8)}`
    } while (existingIds.has(id))

    return id
  }
}
