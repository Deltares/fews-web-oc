import { configManager } from '../../services/application-config/index.ts'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.ts'
import type { WebOcComponent, WebOcConfiguration } from './types.ts'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

export async function getFewsConfig(): Promise<WebOcConfiguration> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const transformRequestFn = (request: Request) =>
    Promise.resolve(authenticationManager.transformRequestAuth(request))
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn,
  })
  const fewsConfig = await webServiceProvider.getWebOcConfiguration()
  const webOcComponents: WebOcComponent[] = []
  for (const componentConfig of fewsConfig.components) {
    webOcComponents.push(componentConfig as WebOcComponent)
  }
  return {
    general: fewsConfig.general,
    webOcComponents,
  }
}
