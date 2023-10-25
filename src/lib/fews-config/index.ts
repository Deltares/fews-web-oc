import { configManager } from '../../services/application-config/index.ts'
import type { WebOcComponent, WebOcConfiguration } from './types.ts'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export async function getFewsConfig(): Promise<WebOcConfiguration> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  let webOcConfiguration: WebOcConfiguration = {
    general: {},
    webOcComponents: [],
  }
  try {
    const fewsConfig = await webServiceProvider.getWebOcConfiguration()
    const webOcComponents: WebOcComponent[] = []
    for (const componentConfig of fewsConfig.components) {
      webOcComponents.push(componentConfig as WebOcComponent)
    }
    webOcConfiguration = {
      general: fewsConfig.general,
      webOcComponents,
    }
  } catch (error) {
    console.error(error)
  } finally {
    return webOcConfiguration
  }
}

export function getResourcesStaticUrl(resource: string) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  return webServiceProvider.resourcesStaticUrl(resource).toString()
}
