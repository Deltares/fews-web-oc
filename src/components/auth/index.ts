import Oidc from 'oidc-client'
import oidcSettings from './config'

Oidc.Log.logger = console
Oidc.Log.level = Oidc.Log.WARN

const auth = new Oidc.UserManager(oidcSettings)
export default auth
