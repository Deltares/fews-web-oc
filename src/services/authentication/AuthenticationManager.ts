import { configManager } from '../application-config/'
import { UserManager, User, UserManagerSettings } from 'oidc-client-ts'
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig'
import { mergeHeaders } from '@/lib/requests/transformRequest'

export class AuthenticationManager {
  userManager!: UserManager
  private user: User | null = null

  async init(settings: UserManagerSettings) {
    this.userManager = new UserManager(settings)
    this.user = await this.userManager.getUser()
    this.userManager.events.addUserLoaded((user: User) => {
      this.user = user
    })
  }

  public getAccessToken(): string {
    if (!configManager.authenticationIsEnabled) return ''
    if (
      configManager.get('VITE_REQUEST_HEADER_AUTHORIZATION') !==
      RequestHeaderAuthorization.BEARER
    )
      return ''
    if (this.user !== null) {
      return this.user.access_token
    }
    throw new Error('User is undefined')
  }

  public getAuthorizationHeaders(): Headers {
    if (!configManager.authenticationIsEnabled) return new Headers({})
    switch (configManager.get('VITE_REQUEST_HEADER_AUTHORIZATION')) {
      case RequestHeaderAuthorization.BEARER: {
        const token = this.getAccessToken()
        const requestAuthHeaders = new Headers({
          Authorization: `Bearer ${token}`,
        })
        return requestAuthHeaders
      }
      default:
        return new Headers({})
    }
  }

  public transformRequestAuth(request: Request, signal?: AbortSignal): Request {
    const requestAuthHeaders = this.getAuthorizationHeaders()
    const requestInit = {
      headers: mergeHeaders(request.headers, requestAuthHeaders),
      signal: signal,
    }
    const newRequest = new Request(request, requestInit)
    return newRequest
  }
}

export const authenticationManager = new AuthenticationManager()
