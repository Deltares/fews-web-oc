import { UserManagerSettings } from 'oidc-client-ts'
import { ApplicationConfig } from './ApplicationConfig'
import oidcSettings from '../config'

export class ApplicationConfigManager {
  _config!: ApplicationConfig

  update (config: Partial<ApplicationConfig>) {
    this._config = { ...this._config, ...config}
  }

  get <T extends keyof ApplicationConfig>(name: T): ApplicationConfig[T] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configValue = this._config[name]
    if (configValue !== undefined ) return configValue
    const envValue = process.env[name]
    if (envValue !== undefined) {
      return envValue
    }
    throw new Error(`Cannot find config for '${name}'`)
  }

  getUserManagerSettings(): UserManagerSettings {
    return {
      ...oidcSettings, ...{
        authority: this.get('VUE_APP_AUTH_AUTHORITY'),
        client_id: this.get('VUE_APP_AUTH_ID'),
        scope: this.get('VUE_APP_AUTH_SCOPE'),
        metadataUrl: this.get('VUE_APP_AUTH_METADATA_URL'),
      }
    }
  }
}
