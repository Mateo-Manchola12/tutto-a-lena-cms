import { inject, Injectable, signal } from '@angular/core'
import type { Business } from '../../types/business'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private firestore = inject(FirestoreService)
  private builds = inject(BuildService)

  private _businessData$ = signal<Business | null>(null)
  private _loading$ = signal(false)

  constructor() {
    void this.initialize()
  }

  private async initialize() {
    await this.builds.waitUntilHydrated()
    await this.loadBusinessData()
  }

  async loadBusinessData() {
    this._loading$.set(true)

    try {
      const draftId = this.builds.getEffectivePointer('lastContentId') ?? 1
      const data = await this.firestore.getDocument<Business>('business_info', String(draftId))
      this._businessData$.set(data)
    } catch (error) {
      console.error('Error loading business data:', error)
      throw new Error('No se pudo cargar la información del negocio, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }

  get businessData() {
    return this._businessData$.asReadonly()
  }

  get loading() {
    return this._loading$.asReadonly()
  }

  async saveBusinessData(updatedData: Business) {
    this._loading$.set(true)

    try {
      const publishedId = this.builds.current()?.lastContentId ?? 0
      const pendingId = this.builds.getPendingPointer('lastContentId')
      const nextDraftId = pendingId ?? publishedId + 1

      await this.firestore.setDocument('business_info', String(nextDraftId), updatedData)
      await this.builds.markDraftPointer('lastContentId', nextDraftId)
      this._businessData$.set(updatedData)
    } catch (error) {
      console.error('Error saving business data:', error)
      throw new Error('No se pudo guardar la información del negocio, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }
}
