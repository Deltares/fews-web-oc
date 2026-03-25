import { UserManager, User, UserManagerSettings } from 'oidc-client-ts'
import type { AuthManager, AuthUser } from './AuthManager'
import { transformRequestWithAuth } from './AuthManager'

export class OidcAuthManager implements AuthManager {
  userManager!: UserManager
  private user: User | null = null
  private initPromise: Promise<void> | null = null
  private settings: UserManagerSettings

  constructor(settings: UserManagerSettings) {
    this.settings = settings
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        this.userManager = new UserManager(this.settings)
        this.user = await this.userManager.getUser()
        if (this.user?.expired) {
          try {
            this.user = await this.userManager.signinSilent()
          } catch (error) {
            console.error('Silent sign-in failed:', error)
            // Redirect to interactive login as a fallback
            await this.userManager.removeUser()
            const base = `${import.meta.env.BASE_URL}`
            const redirect = window.location.pathname.slice(base.length)
            window.location.href = base + 'login?redirect=' + redirect
            // The following return ensures no further code is executed after signinRedirect,
            // as it performs a full-page navigation and interrupts the current execution.
            return
          }
        }
        this.userManager.events.addUserLoaded((user: User) => {
          this.user = user
        })
      })()
    }
    return this.initPromise
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.initPromise) return false
    await this.initPromise
    return this.user !== null && !this.user.expired
  }

  async login(options?: { redirectPath?: string }): Promise<void> {
    await this.userManager.signinRedirect({
      state: options?.redirectPath ?? '/',
    })
  }

  async logout(): Promise<void> {
    await this.userManager.signoutRedirect({ state: '/login' })
  }

  async getUser(): Promise<AuthUser | null> {
    if (!this.initPromise) return null
    await this.initPromise
    if (!this.user) return null
    return {
      name: this.user.profile?.name ?? 'Current User',
      preferredUsername:
        this.user.profile?.preferred_username ??
        'Current User Preferred Username',
      email: this.user.profile?.email,
      roles: this.user.profile?.roles as string[] | undefined,
    }
  }

  getAuthorizationHeaders(): Headers {
    if (this.user !== null) {
      return new Headers({
        Authorization: `Bearer ${this.user.access_token}`,
      })
    }
    return new Headers({})
  }

  transformRequestAuth(request: Request, signal?: AbortSignal): Request {
    return transformRequestWithAuth(this, request, signal)
  }

  onUserLoaded(callback: () => void): void {
    this.userManager.events.addUserLoaded(() => {
      callback()
    })
  }
}
