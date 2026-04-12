import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'

export interface ConfirmActionDialogData {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

@Component({
  selector: 'app-confirm-action-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <p class="text-muted-foreground">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        class="m-2 cursor-pointer rounded px-4 py-2 hover:bg-gray-200/10"
        [mat-dialog-close]="false"
        type="button"
      >
        {{ data.cancelText ?? 'Cancelar' }}
      </button>
      <button class="m-2 cursor-pointer rounded px-4 py-2 hover:bg-gray-200/10" [mat-dialog-close]="true" type="button">
        {{ data.confirmText ?? 'Eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmActionDialogComponent {
  readonly data = inject<ConfirmActionDialogData>(MAT_DIALOG_DATA)
}
