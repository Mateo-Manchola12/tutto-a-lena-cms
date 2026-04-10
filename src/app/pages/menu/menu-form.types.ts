import type { FormArray, FormControl, FormGroup } from '@angular/forms'
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import type { MatChipInputEvent } from '@angular/material/chips'

export type ProductFormGroup = FormGroup<{
  id: FormControl<string>
  name: FormControl<string>
  description: FormControl<string>
  price: FormControl<number | null>
  ingredients: FormControl<string[]>
  tags: FormControl<string[]>
}>

export type CategoryFormGroup = FormGroup<{
  id: FormControl<string>
  name: FormControl<string>
  description: FormControl<string>
  emoji: FormControl<string>
  products: FormArray<ProductFormGroup>
}>

export type TagFormGroup = FormGroup<{
  id: FormControl<string>
  name: FormControl<string>
  emoji: FormControl<string>
}>

export type MenuFormGroup = FormGroup<{
  categories: FormArray<CategoryFormGroup>
  tags: FormArray<TagFormGroup>
}>

export interface MenuTagOption {
  id: string
  name: string
}

export interface MenuProductEditorActions {
  removeIngredient: (menuItem: ProductFormGroup, ingredient: string) => void
  removeTag: (menuItem: ProductFormGroup, tag: string) => void
  addIngredient: (menuItem: ProductFormGroup, event: MatChipInputEvent) => void
  selectedTag: (menuItem: ProductFormGroup, event: MatAutocompleteSelectedEvent) => void
  getTagsFiltered: (menuItem: ProductFormGroup, text?: string | null) => MenuTagOption[]
  getTagNameById: (tagId: string) => string | undefined
}
