import { inject, Injectable, signal } from '@angular/core'
import type { EventEntry, EventsDocument } from '../../types/events'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'

const DEFAULT_EVENTS: EventEntry[] = [
  {
    id: 'event-1',
    title: 'Noche de Vinos Italianos',
    description:
      'Experiencia única degustando vinos italianos premium acompañados de nuestra mejor cocina. El Chef especialista en vinos nos guiará en este viaje por las regiones viñateras de Italia.',
    date: '2026-02-14',
    startTime: '19:30',
    endTime: '22:30',
    location: 'Evento itinerante por confirmar',
    featured: true,
  },
  {
    id: 'event-2',
    title: 'Música en Vivo - Jazz Italiano',
    description:
      'Disfruta de una velada mágica con jazz en vivo mientras degustas nuestras especialidades italianas. Ambiente romántico y sofisticado para parejas y grupos.',
    date: '2026-02-20',
    startTime: '20:00',
    endTime: '23:30',
    location: 'Restaurante anfitrión por confirmar',
    featured: true,
  },
  {
    id: 'event-3',
    title: 'Happy Hour - Viernes 50% OFF',
    description: 'Todos los viernes de 17:00 a 19:00: 50% de descuento en pizzas y bebidas seleccionadas.',
    date: '2026-02-27',
    startTime: '17:00',
    endTime: '19:00',
    location: 'Feria gastronómica por confirmar',
    featured: true,
  },
  {
    id: 'event-4',
    title: 'Cena especial - Menú Chef',
    description:
      'Deja que nuestro chef sorprenda con un menú especial de 5 pasos. Una experiencia culinaria única diseñada para los más exigentes.',
    date: '2026-03-07',
    startTime: '19:30',
    location: 'Cena privada en espacio asociado',
    featured: false,
  },
  {
    id: 'event-5',
    title: 'Clase de Cocina - Cómo hacer pasta fresca',
    description:
      'Aprende directamente de nuestros chefs cómo preparar pasta fresca auténtica. Incluye clase práctica, menú 4 pasos y vino.',
    date: '2026-03-15',
    startTime: '15:00',
    endTime: '18:00',
    location: 'Taller gastronómico colaborativo',
    featured: false,
  },
]

const DEFAULT_EVENTS_DOCUMENT: EventsDocument = {
  events: DEFAULT_EVENTS,
}

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
      this._eventsData$.set(data ?? DEFAULT_EVENTS_DOCUMENT)
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
