import { VERSION as angularVersion, Injectable } from '@angular/core'
import { SDK_VERSION as firebaseVersion } from 'firebase/app'
import packageJson from '../../../package.json'

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  readonly currentYear = new Date().getFullYear()
  readonly appVersion = packageJson.version
  readonly angularVersion = angularVersion.full
  readonly firebaseVersion = firebaseVersion
}
