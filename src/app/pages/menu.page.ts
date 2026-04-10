import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core'
import type { FormControl } from '@angular/forms'
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import type { MatChipInputEvent } from '@angular/material/chips'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIcon } from '@angular/material/icon'
import { MenuService } from '../services/menu.service'
import { MenuCategoryEditorComponent } from './menu/components/menu-category-editor.component'
import type {
  CategoryFormGroup,
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
                <app-menu-category-editor [category]="category" [productEditorActions]="productEditorActions" />
              }

              <mat-expansion-panel hideToggle>
                <mat-expansion-panel-header>
                  <mat-panel-title>Nuevo</mat-panel-title>
                  <mat-panel-description>Agregar nueva categoría </mat-panel-description>
                  <mat-icon>add</mat-icon>
                </mat-expansion-panel-header>
              </mat-expansion-panel>
            </mat-accordion>
          </section>

          <section
            class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg"
          >
            <h2 class="mb-5 text-2xl font-bold">Etiquetas</h2>
          </section>
        </div>
      </form>
    }
  `,
  imports: [ReactiveFormsModule, MatExpansionModule, MatIcon, MenuCategoryEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  readonly menuService = inject(MenuService)
  private formBuilder = inject(FormBuilder)
  readonly menu = this.menuService.menuData
  readonly allTags = computed(() => this.menu()?.tags ?? [])
  private readonly tagsById = computed(() => new Map(this.allTags().map((tag) => [tag.id, tag.name])))

  readonly form: MenuFormGroup = new FormGroup({
    categories: new FormArray<CategoryFormGroup>([]),
    tags: new FormArray<TagFormGroup>([]),
  })

  readonly productEditorActions: MenuProductEditorActions = {
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
    const fb = this.formBuilder.nonNullable

    this.form.setControl('categories', fb.array(menu.categories.map((category) => this.getCategoryFormGroup(category))))
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

  onSave() {
    const formValue = this.form.getRawValue()

    console.log(formValue)
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
}
