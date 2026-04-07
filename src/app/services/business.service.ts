import { inject, Injectable, signal } from '@angular/core'
import type { Business } from '../../types/business'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'
import { SaveService } from './save.service'

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private firestore = inject(FirestoreService)
  private save = inject(SaveService)
  private builds = inject(BuildService)

  private _businessData$ = signal<Business | null>(null)
  private _loading$ = signal(false)

  constructor() {
    void this.loadBusinessData()
  }

  async loadBusinessData() {
    this._loading$.set(true)

    try {
      const data = await this.firestore.getDocument<Business>('business_info', '1')
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
      await this.firestore.updateDocument('business_info', '1', updatedData)
      await this.builds.markDraftPointer('lastContentId', 1)
      this.save.addChange()
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
