import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import type { CategoryFormGroup, MenuProductEditorActions } from '../menu-form.types'
import { MenuProductEditorComponent } from './menu-product-editor.component'

@Component({
  selector: 'app-menu-category-editor',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>{{ category().value.emoji }} {{ category().value.name }}</mat-panel-title>
        <mat-panel-description>{{ category().value.description }} </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="flex gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre de la categoría</mat-label>
          <input matInput placeholder="Pizza" [formControl]="category().controls.name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Emoji</mat-label>
          <input matInput placeholder="🍕" [formControl]="category().controls.emoji" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Descripción</mat-label>
        <input matInput placeholder="Deliciosa pizza de pepperoni" [formControl]="category().controls.description" />
      </mat-form-field>

      <h2 class="mb-5 text-xl font-bold">Productos</h2>

      <mat-accordion class="w-full">
        @for (menuItem of category().controls.products.controls; track menuItem.value.id) {
          <app-menu-product-editor [menuItem]="menuItem" [actions]="productEditorActions()" />
        }

        <mat-expansion-panel hideToggle>
          <mat-expansion-panel-header>
            <mat-panel-title>Nuevo</mat-panel-title>
            <mat-panel-description>Agregar nueva categoría </mat-panel-description>
            <mat-icon>add</mat-icon>
          </mat-expansion-panel-header>
        </mat-expansion-panel>
      </mat-accordion>
    </mat-expansion-panel>
  `,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIcon,
    MenuProductEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuCategoryEditorComponent {
  readonly category = input.required<CategoryFormGroup>()
  readonly productEditorActions = input.required<MenuProductEditorActions>()
}
