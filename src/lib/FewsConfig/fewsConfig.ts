import { configManager } from '@/services/application-config/'
import type { WebOcComponent } from '@/store/modules/fews-config/types'
import { PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { authenticationManager } from '@/services/authentication/AuthenticationManager';
import {WebOcConfiguration} from "@/store/modules/fews-config/types";

export async function getFewsConfig(): Promise<WebOcConfiguration> {
  const baseUrl = configManager.get('VUE_APP_FEWS_WEBSERVICES_URL')
  const transformRequestFn = (request: Request) => Promise.resolve(authenticationManager.transformRequestAuth(request))
  const webServiceProvider = new PiWebserviceProvider(baseUrl, { transformRequestFn })
  const fewsConfig = await webServiceProvider.getWebOcConfiguration()
  const webOcComponents: WebOcComponent[] = []
  for ( const componentConfig of fewsConfig.components ) {
    webOcComponents.push(componentConfig as WebOcComponent)
  }
  return {
    "general": fewsConfig.general,
    "webOcComponents": webOcComponents
  }
}
