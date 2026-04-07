import { Injectable, inject, signal } from '@angular/core'
import { doc, getFirestore, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { BuildCurrent, BuildHistory, BuildPointers, PublishStatus } from '../../types/build'
import { FirebaseApp } from '../providers/firebase.provider'

const DEFAULT_POINTERS: BuildPointers = {
  lastMenuId: null,
  lastContentId: null,
  lastEventsId: null,
  lastGalleryId: null,
}

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  private app = inject(FirebaseApp)
  private db = getFirestore(this.app)

  private currentRef = doc(this.db, 'builds', 'current')
  private _current$ = signal<BuildCurrent | null>(null)

  readonly current = this._current$.asReadonly()

  constructor() {
    onSnapshot(this.currentRef, (snap) => {
      if (!snap.exists()) {
        this._current$.set(null)
        return
      }

      this._current$.set(snap.data() as BuildCurrent)
    })
  }

  async markDraftPointer(domain: keyof BuildPointers, id: number) {
    await setDoc(
      this.currentRef,
      {
        ...DEFAULT_POINTERS,
        status: 'idle',
        buildId: null,
        updatedAt: serverTimestamp(),
        [domain]: id,
      } satisfies Partial<BuildCurrent>,
      { merge: true },
    )
  }

  async startPublish() {
    const nextBuildId = crypto.randomUUID()

    const snapshot = await runTransaction(this.db, async (tx) => {
      const currentSnap = await tx.get(this.currentRef)
      const current = currentSnap.exists() ? (currentSnap.data() as BuildCurrent) : null

      if (current?.status === 'publishing') {
        throw new Error('Ya existe una publicación en curso')
      }

      const buildPointers: BuildPointers = {
        lastMenuId: current?.lastMenuId ?? null,
        lastContentId: current?.lastContentId ?? null,
        lastEventsId: current?.lastEventsId ?? null,
        lastGalleryId: current?.lastGalleryId ?? null,
      }

      tx.set(
        this.currentRef,
        {
          ...buildPointers,
          status: 'publishing',
          buildId: nextBuildId,
          updatedAt: serverTimestamp(),
        } satisfies Partial<BuildCurrent>,
        { merge: true },
      )

      const historyRef = doc(this.db, 'builds', nextBuildId)
      tx.set(historyRef, {
        ...buildPointers,
        buildId: nextBuildId,
        status: 'publishing',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } satisfies Partial<BuildHistory>)

      return {
        buildId: nextBuildId,
        pointers: buildPointers,
      }
    })

    return snapshot
  }

  async finalizePublish(
    buildId: string,
    status: Extract<PublishStatus, 'published' | 'failed'>,
    errorMessage?: string,
  ) {
    await runTransaction(this.db, async (tx) => {
      const currentSnap = await tx.get(this.currentRef)
      const current = currentSnap.exists() ? (currentSnap.data() as BuildCurrent) : null

      if (current?.buildId !== buildId) {
        return
      }

      tx.update(this.currentRef, {
        status,
        updatedAt: serverTimestamp(),
      } satisfies Partial<BuildCurrent>)

      const historyRef = doc(this.db, 'builds', buildId)
      const historyPatch: Partial<BuildHistory> & { updatedAt: unknown } = {
        status,
        updatedAt: serverTimestamp(),
      }

      if (errorMessage) {
        historyPatch.errorMessage = errorMessage
      }

      tx.set(historyRef, historyPatch, { merge: true })
    })
  }

  async markAsFailed(buildId: string, errorMessage: string) {
    await this.finalizePublish(buildId, 'failed', errorMessage)
  }

  async setPublished(buildId: string) {
    await this.finalizePublish(buildId, 'published')
  }

  async resetToIdle() {
    await updateDoc(this.currentRef, {
      status: 'idle',
      buildId: null,
      updatedAt: serverTimestamp(),
    } satisfies Partial<BuildCurrent>)
  }
}
