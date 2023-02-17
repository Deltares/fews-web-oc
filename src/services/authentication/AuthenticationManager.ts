import { configManager } from '../application-config/'
import { UserManager } from "oidc-client-ts";

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
}
