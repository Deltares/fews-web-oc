import { UserManagerSettings } from 'oidc-client-ts'
import {
  ApplicationConfig,
  RequestHeaderAuthorization,
} from './ApplicationConfig'
import { getOidcSettings } from '@/services/authentication/oidcSettings'

export type AuthType = 'oidc' | 'basic' | 'none'

export class ApplicationConfigManager {
  _config!: ApplicationConfig
  _authenticationIsEnabled: boolean = true
  _authType: AuthType = 'none'

  update(config: Partial<ApplicationConfig>) {
    this._config = { ...this._config, ...config }
    const hasOidcAuthority =
      Object.keys(this._config).includes('VITE_AUTH_AUTHORITY') ||
      !!import.meta.env['VITE_AUTH_AUTHORITY']
    const authHeaderValue =
      this._config['VITE_REQUEST_HEADER_AUTHORIZATION'] ??
      import.meta.env['VITE_REQUEST_HEADER_AUTHORIZATION']
    const isBasicAuth =
      authHeaderValue === RequestHeaderAuthorization.BASIC && !hasOidcAuthority
    if (hasOidcAuthority) {
      this._authType = 'oidc'
    } else if (isBasicAuth) {
      this._authType = 'basic'
    } else {
      this._authType = 'none'
    }
    this._authenticationIsEnabled = this._authType !== 'none'
  }

  get<T extends keyof ApplicationConfig>(name: T): ApplicationConfig[T] {
    const configValue = this._config[name]
    if (configValue !== undefined) return configValue
    const envValue = import.meta.env[name]
    return envValue
  }

  getWithDefault<T extends keyof ApplicationConfig>(
    name: T,
    defaultValue: ApplicationConfig[T],
  ): ApplicationConfig[T] {
    const configValue = this._config[name]
    if (configValue !== undefined) return configValue
    const envValue = import.meta.env[name]
    if (envValue !== undefined) {
      return envValue
    }
    return defaultValue
  }

  get authenticationIsEnabled(): boolean {
    return this._authenticationIsEnabled
  }

  get authType(): AuthType {
    return this._authType
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
