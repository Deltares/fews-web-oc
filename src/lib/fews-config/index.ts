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

export function getResourcesIconsUrl(resource: string) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  return webServiceProvider.resourcesIconsUrl(resource).toString()
}

export async function getLocalOrRemoteFileUrl(
  localBase: string,
  relativePath?: string,
) {
  if (!relativePath) return
  const remoteUrl = getResourcesStaticUrl(relativePath)
  const localUrl = `${localBase}${relativePath}`

  const isHtmlResponse = (response: Response) => {
    const contentType = response.headers.get('Content-Type')
    return contentType?.includes('text/html') ?? false
  }

  try {
    const remoteResponse = await fetch(remoteUrl, { method: 'HEAD' })
    if (remoteResponse.ok && !isHtmlResponse(remoteResponse)) {
      return remoteUrl
    }
  } catch (error) {
    // Handle fetch error
  }

  try {
    const localResponse = await fetch(localUrl, { method: 'HEAD' })
    if (localResponse.ok && !isHtmlResponse(localResponse)) {
      return localUrl
    }
  } catch (error) {
    // Handle fetch error
  }
}
