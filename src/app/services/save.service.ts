import { computed, inject, Injectable } from '@angular/core'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { FirebaseApp } from '../providers/firebase.provider'
import { BuildService } from './build.service'

@Injectable({
  providedIn: 'root',
})
export class SaveService {
  private _app = inject(FirebaseApp)
  private builds = inject(BuildService)
  private functions = getFunctions(this._app)

  private saveChangesCallable = httpsCallable<unknown, { status: 'ok'; message: string }>(
    this.functions,
    'triggerAstroBuild',
  )
  isChangesSaved = computed(() => !this.builds.hasPendingChanges())
  lastUpdate = computed<Date>(() => {
    const updatedAt = this.builds.current()?.updatedAt

    if (updatedAt instanceof Date) {
      return updatedAt
    }

    if (updatedAt && typeof updatedAt === 'object' && 'toDate' in updatedAt && typeof updatedAt.toDate === 'function') {
      return updatedAt.toDate()
    }

    return new Date()
  })

  async saveChanges() {
    await this.builds.waitUntilHydrated()

    const isRetryAfterFailedDeploy = this.builds.current()?.status === 'failed'
    const hasPendingChanges = this.builds.hasPendingChanges()

    if (!hasPendingChanges && !isRetryAfterFailedDeploy) {
      return
    }

    const publish = await this.builds.startPublish()

    try {
      await this.saveChangesCallable()

      console.info(`Build ${publish.buildId} triggered successfully`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo disparar la build'
      await this.builds.markAsFailed(publish.buildId, message)
      throw error
    }
  }
}
