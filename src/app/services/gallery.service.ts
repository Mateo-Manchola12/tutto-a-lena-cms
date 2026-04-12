import { inject, Injectable, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import type { GalleryDocument } from '../../types/gallery'
import { FirebaseStorage } from '../providers/firebase.provider'
import { BuildService } from './build.service'
import { FirestoreService } from './firestore.service'

export interface UploadProgress {
  percent: number
  url?: string
  storagePath?: string
}

export interface UploadHandle {
  progress$: Subject<UploadProgress>
  cancel: () => void
}

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private firestore = inject(FirestoreService)
  private builds = inject(BuildService)
  private storage = inject(FirebaseStorage)

  private _galleryData$ = signal<GalleryDocument | null>(null)
  private _loading$ = signal(false)

  readonly galleryData = this._galleryData$.asReadonly()
  readonly loading = this._loading$.asReadonly()

  constructor() {
    void this.initialize()
  }

  private async initialize() {
    await this.builds.waitUntilHydrated()
    await this.loadGalleryData()
  }

  async loadGalleryData() {
    this._loading$.set(true)

    try {
      const draftId = this.builds.getEffectivePointer('lastGalleryId') ?? 1
      const data = await this.firestore.getDocument<GalleryDocument>('gallery', String(draftId))
      this._galleryData$.set(data ?? { images: [] })
    } catch (error) {
      console.error('Error loading gallery data:', error)
      throw new Error('No se pudo cargar la galería, contacte al soporte', { cause: error })
    } finally {
      this._loading$.set(false)
    }
  }

  async saveGalleryData(updatedData: GalleryDocument) {
    this._loading$.set(true)

    try {
      const publishedId = this.builds.current()?.lastGalleryId ?? 0
      const pendingId = this.builds.getPendingPointer('lastGalleryId')
      const nextDraftId = pendingId ?? publishedId + 1

      await this.firestore.setDocument('gallery', String(nextDraftId), updatedData)
      await this.builds.markDraftPointer('lastGalleryId', nextDraftId)
      this._galleryData$.set(updatedData)
    } catch (error) {
      console.error('Error saving gallery data:', error)
      throw new Error('No se pudo guardar la galería, contacte al soporte', { cause: error })
    } finally {
      this._loading$.set(false)
    }
  }

  uploadImage(file: File): UploadHandle {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `gallery/images/${crypto.randomUUID()}.${ext}`
    const storageRef = ref(this.storage, storagePath)
    const uploadTask = uploadBytesResumable(storageRef, file)
    const progress$ = new Subject<UploadProgress>()

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        progress$.next({ percent })
      },
      (error) => {
        progress$.error(error)
      },
      () => {
        void getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          progress$.next({ percent: 100, url, storagePath })
          progress$.complete()
        })
      },
    )

    return {
      progress$,
      cancel: () => {
        uploadTask.cancel()
      },
    }
  }

  async deleteImage(storagePath: string): Promise<void> {
    if (!storagePath) return
    await deleteObject(ref(this.storage, storagePath))
  }
}
