import { inject, Injectable, signal } from '@angular/core'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private firestore = inject(FirestoreService)
  private builds = inject(BuildService)

  private _menuData$ = signal<Menu | null>(null)
  private _loading$ = signal(false)

  readonly menuData = this._menuData$.asReadonly()
  readonly loading = this._loading$.asReadonly()

  constructor() {
    void this.initialize()
  }

  private async initialize() {
    await this.builds.waitUntilHydrated()
    await this.loadMenuData()
  }

  async loadMenuData() {
    this._loading$.set(true)

    try {
      const draftId = this.builds.getEffectivePointer('lastMenuId') ?? 1
      const data = await this.firestore.getDocument<Menu>('menu', String(draftId))
      this._menuData$.set(data)
    } catch (error) {
      console.error('Error loading menu data:', error)
      throw new Error('No se pudo cargar la información del menú, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }

  async saveMenuData(updatedData: Menu) {
    this._loading$.set(true)

    try {
      const publishedId = this.builds.current()?.lastMenuId ?? 0
      const pendingId = this.builds.getPendingPointer('lastMenuId')
      const nextDraftId = pendingId ?? publishedId + 1

      await this.firestore.setDocument('menu', String(nextDraftId), updatedData)
      await this.builds.markDraftPointer('lastMenuId', nextDraftId)
      this._menuData$.set(updatedData)
    } catch (error) {
      console.error('Error saving menu data:', error)
      throw new Error('No se pudo guardar la información del menú, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }
}
