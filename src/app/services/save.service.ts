import { computed, inject, Injectable, signal } from '@angular/core'
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
  private _changeCounter$ = signal(0)

  private saveChangesCallable = httpsCallable<unknown, { status: 'ok'; message: string }>(
    this.functions,
    'triggerAstroBuild',
  )
  isChangesSaved = computed(() => this._changeCounter$() === 0)
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

  addChange() {
    this._changeCounter$.update((counter) => counter + 1)
  }

  async saveChanges() {
    const isRetryAfterFailedDeploy = this.builds.current()?.status === 'failed'

    if (this._changeCounter$() === 0 && !isRetryAfterFailedDeploy) {
      return
    }

    const publish = await this.builds.startPublish()

    try {
      await this.saveChangesCallable()

      this._changeCounter$.set(0)
      console.info(`Build ${publish.buildId} triggered successfully`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo disparar la build'
      await this.builds.markAsFailed(publish.buildId, message)
      throw error
    }
  }
}
