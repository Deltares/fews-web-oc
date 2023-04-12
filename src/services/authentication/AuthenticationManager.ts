import { configManager } from '../application-config/'
import { UserManager } from "oidc-client-ts";
import { RequestHeaderAuthorization } from '../application-config/ApplicationConfig';

export class AuthenticationManager extends UserManager{
  private readonly _userManager: UserManager

  public constructor() {
    const settings = configManager.getUserManagerSettings()
    super(settings)
    this._userManager = new UserManager(settings)
  }

  public async getAccessToken(): Promise<string> {
    const user = await this._userManager.getUser();
    if (user && user.access_token) {
        return user.access_token;
    }
    return ''
  }

  public async getAuthorizationHeaders(): Promise<HeadersInit> {
    if (!configManager.authenticationIsEnabled) return {}
    switch (configManager.get('VUE_APP_REQUEST_HEADER_AUTHORIZATION')){
      case (RequestHeaderAuthorization.BEARER): {
        const token = await this.getAccessToken()
        const requestAuthHeaders = {'Authorization': `Bearer ${token}`}
        return requestAuthHeaders
      }
      default:
        return {}
    }
  }
}
