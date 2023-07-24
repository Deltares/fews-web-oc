import { configManager } from '@/services/application-config/'
import type { WebOcComponent } from '@/store/modules/fews-config/types'
import { PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { authenticationManager } from '@/services/authentication/AuthenticationManager';

export async function getFewsConfig(): Promise<WebOcComponent[]> {
  const baseUrl = configManager.get('VUE_APP_FEWS_WEBSERVICES_URL')
  const transformRequestFn = (request: Request) => Promise.resolve(authenticationManager.transformRequestAuth(request))
  const webServiceProvider = new PiWebserviceProvider(baseUrl, { transformRequestFn })
  const fewsConfig = await webServiceProvider.getWebOcConfiguration()
  const webOcComponents: WebOcComponent[] = []
  for ( const componentConfig of fewsConfig.components ) {
    webOcComponents.push(componentConfig as WebOcComponent)
  }
  // HACK: manually add the METOC data view to the list of components.
  webOcComponents.push({
    id: 'metocDataViewer',
    type: 'MetocDataViewer',
    title: 'METOC Data View'
  })
  return webOcComponents
}
