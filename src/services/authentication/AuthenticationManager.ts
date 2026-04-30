import { configManager } from '../application-config/'
import { UserManager, User, UserManagerSettings } from 'oidc-client-ts'
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig'
import { mergeHeaders } from '@/lib/requests/transformRequest'

export class AuthenticationManager {
  userManager!: UserManager
  private user: User | null = null
  private userReady: Promise<void> | null = null

  init(settings: UserManagerSettings): void {
    this.userReady = new Promise(async (resolve, reject) => {
      try {
        this.userManager = new UserManager(settings)
        this.userManager.events.addUserLoaded((user) => {
          this.user = user
          if (this.user) resolve()
        })

        this.user = await this.userManager.getUser()
        if (this.user) resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  public async getUser(): Promise<User | null> {
    if (this.userReady == null) {
      // Authentication is disabled
      return null
    }
    await this.userReady
    await this.checkExpired(this.user)
    return this.user
  }

  private async checkExpired(user: User | null): Promise<void> {
    if (!user) return
    if (!user.expired) return

    try {
      this.user = await this.userManager.signinSilent()
    } catch (error) {
      console.error('Silent sign-in failed:', error)
      // Redirect to interactive login as a fallback
      await this.userManager.removeUser()
      const base = `${import.meta.env.BASE_URL}`
      const redirect = window.location.pathname.slice(base.length)
      window.location.href = base + 'login?redirect=' + redirect
    }
  }

  public async getAccessToken(): Promise<string> {
    if (!configManager.authenticationIsEnabled) return ''
    if (
      configManager.get('VITE_REQUEST_HEADER_AUTHORIZATION') !==
      RequestHeaderAuthorization.BEARER
    )
      return ''
    const user = await this.getUser()
    if (user !== null) {
      return user.access_token
    }
    throw new Error('User is undefined')
  }

  public async getAuthorizationHeaders(): Promise<Headers> {
    if (!configManager.authenticationIsEnabled) return new Headers({})
    switch (configManager.get('VITE_REQUEST_HEADER_AUTHORIZATION')) {
      case RequestHeaderAuthorization.BEARER: {
        const token = await this.getAccessToken()
        const requestAuthHeaders = new Headers({
          Authorization: `Bearer ${token}`,
        })
        return requestAuthHeaders
      }
      default:
        return new Headers({})
    }
  }

  public async transformRequestAuth(
    request: Request,
    signal?: AbortSignal,
  ): Promise<Request> {
    const requestAuthHeaders = await this.getAuthorizationHeaders()
    const requestInit = {
      headers: mergeHeaders(request.headers, requestAuthHeaders),
      signal: signal,
    }
    const newRequest = new Request(request, requestInit)
    return newRequest
  }
}

export const authenticationManager = new AuthenticationManager()
