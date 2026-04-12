import { Component } from '@angular/core'

@Component({
  selector: 'app-publishing-snackbar',
  template: `
    <div class="flex items-center justify-start gap-4">
      <div
        class="border-primary border-r-primary-active size-8 animate-spin rounded-full border-4 border-t-transparent"
      ></div>

      <span>Publicando...</span>
    </div>
  `,
})
export class PublishingSnackbarComponent {}
