import type { AuthManager, AuthUser } from './AuthManager'
import { transformRequestWithAuth } from './AuthManager'

const CREDENTIALS_KEY = 'basicauth_credentials'
const USERNAME_KEY = 'basicauth_username'

export class BasicAuthManager implements AuthManager {
  async init(): Promise<void> {}

  async isAuthenticated(): Promise<boolean> {
    return sessionStorage.getItem(CREDENTIALS_KEY) !== null
  }

  async login(options?: {
    username?: string
    password?: string
    redirectPath?: string
  }): Promise<void> {
    if (options?.username && options?.password) {
      const encoded = btoa(`${options.username}:${options.password}`)
      sessionStorage.setItem(CREDENTIALS_KEY, encoded)
      sessionStorage.setItem(USERNAME_KEY, options.username)
    } else {
      const base = import.meta.env.BASE_URL
      const redirect = options?.redirectPath ?? '/'
      window.location.href = `${base}login?redirect=${encodeURIComponent(redirect)}`
    }
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(CREDENTIALS_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
    window.location.href = import.meta.env.BASE_URL + 'login'
  }

  async getUser(): Promise<AuthUser | null> {
    const username = sessionStorage.getItem(USERNAME_KEY)
    if (!username) return null
    return {
      name: username,
      preferredUsername: username,
    }
  }

  getAuthorizationHeaders(): Headers {
    const credentials = sessionStorage.getItem(CREDENTIALS_KEY)
    if (credentials) {
      return new Headers({ Authorization: `Basic ${credentials}` })
    }
    return new Headers({})
  }

  transformRequestAuth(request: Request, signal?: AbortSignal): Request {
    return transformRequestWithAuth(this, request, signal)
  }

  onUserLoaded(_callback: () => void): void {}
}
