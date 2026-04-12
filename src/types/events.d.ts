export interface EventCta {
  label: string
  url: string
}

export interface EventCoordinates {
  lat: number
  lng: number
}

export interface EventEntry {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime?: string
  location: string
  locationPlaceId?: string
  locationCoordinates?: EventCoordinates
  locationGoogleMapsUrl?: string
  locationValidatedAt?: string
  featured: boolean
  cta?: EventCta
}

export interface EventsDocument {
  events: EventEntry[]
}
