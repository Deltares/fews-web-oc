import { configManager } from '@/services/application-config/'
import { AuthenticationManager } from '@/services/authentication/AuthenticationManager'
import type { WebOcComponent } from '@/store/modules/fews-config/types'

export async function getFewsConfig(): Promise<WebOcComponent[]> {
  const baseUrl = configManager.get('VUE_APP_FEWS_WEBSERVICES_URL')
  const request = new Request(`${baseUrl}/rest/fewspiservice/v1/weboc/config?documentFormat=PI_JSON`)
  const response = await fetch( await transformRequest(request))
  const fewsConfig = await response.json()
  const webOcComponents: WebOcComponent[] = []
  for ( const componentConfig of fewsConfig.components ) {
    const webOcComponent: WebOcComponent = {
      id: componentConfig.id,
      component: componentConfig.type,
      title: componentConfig.title,
      icon: componentConfig.icon,
    }
    webOcComponents.push(webOcComponent)
  }
  return webOcComponents
}

async function transformRequest(request: Request): Promise<Request> {
  if (!configManager.authenticationIsEnabled) return request
  // $auth only exists if authentication is enabled.
  const authenticationManager = new AuthenticationManager()
  const newRequest = await authenticationManager.transformRequestAuth(request)
  return newRequest
}
