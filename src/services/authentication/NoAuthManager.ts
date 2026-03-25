import type { AuthManager, AuthUser } from './AuthManager'
import { transformRequestWithAuth } from './AuthManager'

export class NoAuthManager implements AuthManager {
  async init(): Promise<void> {}

  async isAuthenticated(): Promise<boolean> {
    return true
  }

  async login(): Promise<void> {}

  async logout(): Promise<void> {}

  async getUser(): Promise<AuthUser | null> {
    return null
  }

  getAuthorizationHeaders(): Headers {
    return new Headers({})
  }

  transformRequestAuth(request: Request, signal?: AbortSignal): Request {
    return transformRequestWithAuth(this, request, signal)
  }

  onUserLoaded(_callback: () => void): void {}
}
