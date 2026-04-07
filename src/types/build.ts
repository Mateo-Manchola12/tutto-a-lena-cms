import type { FieldValue, Timestamp } from 'firebase/firestore'

type FirestoreDateValue = Timestamp | FieldValue | null

export type PublishStatus = 'idle' | 'publishing' | 'published' | 'failed'

export interface BuildPointers {
  lastMenuId: number | null
  lastContentId: number | null
  lastEventsId: number | null
  lastGalleryId: number | null
}

export interface BuildCurrent extends BuildPointers {
  status: PublishStatus
  buildId: string | null
  updatedAt: FirestoreDateValue
}

export interface BuildHistory extends BuildPointers {
  status: PublishStatus
  buildId: string
  createdAt: FirestoreDateValue
  updatedAt: FirestoreDateValue
  errorMessage?: string
}
