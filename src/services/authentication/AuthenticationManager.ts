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
        this.userManager.events.addUserLoaded(async (newUser: User) => {
          await this.setUser(newUser)
          if (newUser) resolve()
        })

        const initialUser = await this.userManager.getUser()
        await this.setUser(initialUser)
        if (initialUser) resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  public async getUser(): Promise<User | null> {
    if (!this.userReady) {
      // Authentication is disabled
      return null
    }
    await this.userReady
    return this.user
  }

  public async setUser(user: User | null): Promise<void> {
    this.user = user

    if (user?.expired) {
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

  public async signinRedirectCallback(url?: string): Promise<User> {
    return await this.userManager.signinRedirectCallback(url)
  }
}

export const authenticationManager = new AuthenticationManager()
