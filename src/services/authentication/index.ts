import type { AuthManager } from './AuthManager'
import type { AuthType } from '../application-config/ApplicationConfigManager'
import type { UserManagerSettings } from 'oidc-client-ts'
import { OidcAuthManager } from './AuthenticationManager'
import { BasicAuthManager } from './BasicAuthManager'
import { NoAuthManager } from './NoAuthManager'

export type { AuthManager, AuthUser } from './AuthManager'
export { OidcAuthManager } from './AuthenticationManager'
export { BasicAuthManager } from './BasicAuthManager'
export { NoAuthManager as NoopAuthManager } from './NoAuthManager'

let _authenticationManager: AuthManager = new NoAuthManager()

export function createAuthManager(
  authType: AuthType,
  oidcSettings?: UserManagerSettings,
): AuthManager {
  switch (authType) {
    case 'oidc':
      if (!oidcSettings) {
        throw new Error('OIDC auth requires UserManagerSettings')
      }
      return new OidcAuthManager(oidcSettings)
    case 'basic':
      return new BasicAuthManager()
    default:
      return new NoAuthManager()
  }
}

export function initAuthManager(
  authType: AuthType,
  oidcSettings?: UserManagerSettings,
): void {
  _authenticationManager = createAuthManager(authType, oidcSettings)
}

export const authenticationManager: AuthManager = new Proxy({} as AuthManager, {
  get(_target, prop) {
    const value = Reflect.get(_authenticationManager, prop)
    if (typeof value === 'function') {
      return value.bind(_authenticationManager)
    }
    return value
  },
})
