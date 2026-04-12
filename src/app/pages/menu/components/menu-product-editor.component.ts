import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatChipsModule } from '@angular/material/chips'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import type { Subscription } from 'rxjs'
import { startWith } from 'rxjs'
import type { MenuProductEditorActions, ProductFormGroup } from '../menu-form.types'

@Component({
  selector: 'app-menu-product-editor',
  template: `
    <mat-expansion-panel [expanded]="isExpanded()">
      <mat-expansion-panel-header>
        <mat-panel-title>{{ menuItem().value.name }}</mat-panel-title>
        <mat-panel-description>{{ menuItem().value.description }} </mat-panel-description>
        <button
          type="button"
          class="m-2 flex cursor-pointer items-center justify-center rounded-md p-1 text-red-400 hover:bg-red-500/10"
          aria-label="Eliminar producto"
          (click)="$event.stopPropagation(); actions().removeProduct(menuItem())"
        >
          <i class="mat-icon">delete</i>
        </button>
      </mat-expansion-panel-header>

      <div class="flex gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre del producto</mat-label>
          <input matInput placeholder="Pizza Peperoni" [formControl]="menuItem().controls.name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Precio del producto</mat-label>
          <input
            matInput
            class="text-right"
            placeholder="10.99"
            [formControl]="menuItem().controls.price"
            type="number"
          />
          <span matTextSuffix>&nbsp;€</span>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Descripción</mat-label>
        <input matInput placeholder="Deliciosa pizza de pepperoni" [formControl]="menuItem().controls.description" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Ingredientes</mat-label>
        <mat-chip-grid #ingredientsList [formControl]="menuItem().controls.ingredients">
          @for (ingredient of menuItem().controls.ingredients.value; track $index) {
            <mat-chip-row (removed)="actions().removeIngredient(menuItem(), ingredient)">
              {{ ingredient }}
              <button matChipRemove>
                <i class="mat-icon">cancel</i>
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          placeholder="Mozzarella"
          [matChipInputFor]="ingredientsList"
          (matChipInputTokenEnd)="actions().addIngredient(menuItem(), $event)"
          [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Etiquetas</mat-label>
        <mat-chip-grid #tags [formControl]="menuItem().controls.tags">
          @for (tag of menuItem().controls.tags.value; track $index) {
            <mat-chip-row [value]="tag" (removed)="actions().removeTag(menuItem(), tag)">
              {{ getTagLabel(tag) }}
              <button matChipRemove>
                <i class="mat-icon">cancel</i>
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>

        <input
          matInput
          placeholder="Sin gluten"
          aria-label="Buscar etiquetas"
          [formControl]="tagFilterControl"
          [matChipInputFor]="tags"
          [matAutocomplete]="auto"
          [matChipInputAddOnBlur]="false"
        />

        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectTag($event)">
          @for (tag of filteredTags(); track tag.id) {
            <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
    </mat-expansion-panel>
  `,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuProductEditorComponent {
  readonly menuItem = input.required<ProductFormGroup>()
  readonly actions = input.required<MenuProductEditorActions>()
  readonly isExpanded = input(false)
  readonly tagFilterControl = new FormControl('', { nonNullable: true })
  private readonly selectedTagIds = signal<string[]>([])
  private readonly tagQuery = toSignal(
    this.tagFilterControl.valueChanges.pipe(startWith(this.tagFilterControl.value)),
    { initialValue: this.tagFilterControl.value },
  )
  readonly filteredTags = computed(() => {
    this.selectedTagIds()

    return this.actions().getTagsFiltered(this.menuItem(), this.tagQuery())
  })

  readonly separatorKeysCodes: number[] = [ENTER, COMMA]

  constructor() {
    effect((onCleanup) => {
      const tagsControl = this.menuItem().controls.tags

      this.selectedTagIds.set(tagsControl.getRawValue())

      const subscription: Subscription = tagsControl.valueChanges.subscribe((value) => {
        this.selectedTagIds.set(value)
      })

      onCleanup(() => {
        subscription.unsubscribe()
      })
    })
  }

  getTagLabel(tagId: string): string {
    return this.actions().getTagNameById(tagId) ?? tagId
  }

  selectTag(event: MatAutocompleteSelectedEvent): void {
    this.actions().selectedTag(this.menuItem(), event)
    this.tagFilterControl.setValue('')
  }
}
