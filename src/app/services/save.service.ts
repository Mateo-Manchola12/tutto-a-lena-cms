import { computed, Injectable, signal } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class SaveService {
  private _changeCounter$ = signal(0)
  private _lastUpdate$ = signal(new Date())
  isChangesSaved = computed(() => this._changeCounter$() === 0)

  get lastUpdate() {
    return this._lastUpdate$.asReadonly()
  }
}
