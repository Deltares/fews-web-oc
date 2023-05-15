import { configManager } from '../application-config/'
import { UserManager, User, UserManagerSettings } from "oidc-client-ts";
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig';

export class AuthenticationManager {
  userManager!: UserManager
  private user: User | null = null

  init(settings: UserManagerSettings) {
    this.userManager = new UserManager(settings)
    this.userManager.getUser().then((user) => {
      this.user = user
    })
    this.userManager.events.addUserLoaded((user: User) => {
      this.user = user})
  }

  public getAccessToken(): string {
    if (this.user !== null) {
      return this.user.access_token;
    }
    return ''
  }

  public getAuthorizationHeaders(): HeadersInit {
    if (!configManager.authenticationIsEnabled) return {}
    switch (configManager.get('VUE_APP_REQUEST_HEADER_AUTHORIZATION')){
      case (RequestHeaderAuthorization.BEARER): {
        const token = this.getAccessToken()
        const requestAuthHeaders = {'Authorization': `Bearer ${token}`}
        return requestAuthHeaders
      }
      default:
        return {}
    }
  }

  public transformRequestAuth(request: Request, signal?: AbortSignal): Request {
    const requestAuthHeaders = this.getAuthorizationHeaders()
    const requestInit = { headers: requestAuthHeaders, signal: signal}
    const newRequest = new Request(request, requestInit)
    return newRequest
  }
}

export const authenticationManager = new AuthenticationManager()
