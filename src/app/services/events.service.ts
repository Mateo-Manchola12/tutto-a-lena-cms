import { inject, Injectable, signal } from '@angular/core'
import type { EventsDocument } from '../../types/events'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private firestore = inject(FirestoreService)
  private builds = inject(BuildService)

  private _eventsData$ = signal<EventsDocument | null>(null)
  private _loading$ = signal(false)

  readonly eventsData = this._eventsData$.asReadonly()
  readonly loading = this._loading$.asReadonly()

  constructor() {
    void this.initialize()
  }

  private async initialize() {
    await this.builds.waitUntilHydrated()
    await this.loadEventsData()
  }

  async loadEventsData() {
    this._loading$.set(true)

    try {
      const draftId = this.builds.getEffectivePointer('lastEventsId') ?? 1
      const data = await this.firestore.getDocument<EventsDocument>('events', String(draftId))
      this._eventsData$.set(data ?? { events: [] })
    } catch (error) {
      console.error('Error loading events data:', error)
      throw new Error('No se pudo cargar la información de eventos, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }

  async saveEventsData(updatedData: EventsDocument) {
    this._loading$.set(true)

    try {
      const publishedId = this.builds.current()?.lastEventsId ?? 0
      const pendingId = this.builds.getPendingPointer('lastEventsId')
      const nextDraftId = pendingId ?? publishedId + 1

      await this.firestore.setDocument('events', String(nextDraftId), updatedData)
      await this.builds.markDraftPointer('lastEventsId', nextDraftId)
      this._eventsData$.set(updatedData)
    } catch (error) {
      console.error('Error saving events data:', error)
      throw new Error('No se pudo guardar la información de eventos, contacte al soporte', {
        cause: error,
      })
    } finally {
      this._loading$.set(false)
    }
  }
}
