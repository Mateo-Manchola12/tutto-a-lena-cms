import { computed, inject, Injectable, signal } from '@angular/core'
import { doc, getFirestore, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { BuildCurrent, BuildHistory, BuildPointers, PublishStatus } from '../../types/build'
import { FirebaseApp } from '../providers/firebase.provider'

type PendingPointers = Partial<BuildPointers> & { updatedAt?: unknown }

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
  private pendingRef = doc(this.db, 'builds', 'pending')
  private _current$ = signal<BuildCurrent | null>(null)
  private _pending$ = signal<PendingPointers | null>(null)
  private hasLoadedCurrent = false
  private hasLoadedPending = false
  private resolveHydrated: (() => void) | null = null
  private hydratedPromise = new Promise<void>((resolve) => {
    this.resolveHydrated = resolve
  })

  readonly current = this._current$.asReadonly()
  readonly hasPendingChanges = computed(() => {
    const pending = this._pending$()

    if (!pending) {
      return false
    }

    return (
      pending.lastMenuId !== null ||
      pending.lastContentId !== null ||
      pending.lastEventsId !== null ||
      pending.lastGalleryId !== null
    )
  })

  private markHydratedIfReady() {
    if (this.hasLoadedCurrent && this.hasLoadedPending) {
      this.resolveHydrated?.()
      this.resolveHydrated = null
    }
  }

  async waitUntilHydrated() {
    await this.hydratedPromise
  }

  constructor() {
    onSnapshot(this.currentRef, (snap) => {
      this.hasLoadedCurrent = true

      if (!snap.exists()) {
        this._current$.set(null)
        this.markHydratedIfReady()
        return
      }

      this._current$.set(snap.data() as BuildCurrent)
      this.markHydratedIfReady()
    })

    onSnapshot(this.pendingRef, (snap) => {
      this.hasLoadedPending = true

      if (!snap.exists()) {
        this._pending$.set(null)
        this.markHydratedIfReady()
        return
      }

      this._pending$.set(snap.data() as PendingPointers)
      this.markHydratedIfReady()
    })
  }

  async markDraftPointer(domain: keyof BuildPointers, id: number) {
    await setDoc(
      this.pendingRef,
      {
        updatedAt: serverTimestamp(),
        [domain]: id,
      } satisfies PendingPointers,
      { merge: true },
    )
  }

  getPendingPointer(domain: keyof BuildPointers): number | null {
    return this._pending$()?.[domain] ?? null
  }

  getEffectivePointer(domain: keyof BuildPointers): number | null {
    return this.getPendingPointer(domain) ?? this.current()?.[domain] ?? null
  }

  async startPublish() {
    const nextBuildId = crypto.randomUUID()

    const snapshot = await runTransaction(this.db, async (tx) => {
      const currentSnap = await tx.get(this.currentRef)
      const current = currentSnap.exists() ? (currentSnap.data() as BuildCurrent) : null
      const pendingSnap = await tx.get(this.pendingRef)
      const pending = pendingSnap.exists() ? (pendingSnap.data() as PendingPointers) : null

      if (current?.status === 'publishing') {
        throw new Error('Ya existe una publicación en curso')
      }

      const buildPointers: BuildPointers = {
        lastMenuId: pending?.lastMenuId ?? current?.lastMenuId ?? 1,
        lastContentId: pending?.lastContentId ?? current?.lastContentId ?? 1,
        lastEventsId: pending?.lastEventsId ?? current?.lastEventsId ?? 1,
        lastGalleryId: pending?.lastGalleryId ?? current?.lastGalleryId ?? 1,
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

      tx.set(this.pendingRef, {
        ...DEFAULT_POINTERS,
        updatedAt: serverTimestamp(),
      } satisfies PendingPointers)

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
