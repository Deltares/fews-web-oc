import { configManager } from '../application-config/'
import { UserManager, User, UserManagerSettings } from 'oidc-client-ts'
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig'
import { mergeHeaders } from '@/lib/requests/transformRequest'

export class AuthenticationManager {
  userManager!: UserManager

  init(settings: UserManagerSettings) {
    this.userManager = new UserManager(settings)
  }

  public async getUser(): Promise<User | null> {
    if (!configManager.authenticationIsEnabled) {
      return null
    }
    return await this.userManager.getUser()
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
