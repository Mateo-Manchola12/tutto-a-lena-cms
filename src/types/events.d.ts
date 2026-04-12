export interface EventCta {
  label: string
  url: string
}

export interface EventEntry {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime?: string
  location: string
  featured: boolean
  cta?: EventCta
}

export interface EventsDocument {
  events: EventEntry[]
}