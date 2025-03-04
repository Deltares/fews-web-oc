import { UserManagerSettings } from 'oidc-client-ts'
import { ApplicationConfig } from './ApplicationConfig'
import { getOidcSettings } from '@/services/authentication/oidcSettings'

export class ApplicationConfigManager {
  _config!: ApplicationConfig
  _authenticationIsEnabled: boolean = true

  update(config: Partial<ApplicationConfig>) {
    this._config = { ...this._config, ...config }
    this._authenticationIsEnabled =
      Object.keys(this._config).includes('VITE_AUTH_AUTHORITY') ||
      !!import.meta.env['VITE_AUTH_AUTHORITY']
  }

  get<T extends keyof ApplicationConfig>(name: T): ApplicationConfig[T] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = this.getIfAvailable(name)
    if (value !== undefined) return value
    throw new Error(`Cannot find config for '${name}'`)
  }

  getIfAvailable<T extends keyof ApplicationConfig>(
    name: T,
  ): ApplicationConfig[T] | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configValue = this._config[name]
    if (configValue !== undefined) return configValue
    const envValue = import.meta.env[name]
    return envValue
  }

  get authenticationIsEnabled(): boolean {
    return this._authenticationIsEnabled
  }

  getUserManagerSettings(): UserManagerSettings {
    return {
      ...getOidcSettings(),
      ...{
        authority: this.get('VITE_AUTH_AUTHORITY'),
        client_id: this.get('VITE_AUTH_ID'),
        scope: this.get('VITE_AUTH_SCOPE'),
        metadataUrl: this.get('VITE_AUTH_METADATA_URL'),
      },
    }
  }
}
