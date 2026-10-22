import { configManager } from '../../services/application-config/index.ts'
import type { WebOcComponent, WebOcConfiguration } from './types.ts'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { FewsConfigLoadError } from '@/lib/startup/startup-error.js'

export async function getFewsConfig(): Promise<WebOcConfiguration> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const fewsConfig = await webServiceProvider
    .getWebOcConfiguration()
    .catch((error: unknown) => {
      throw new FewsConfigLoadError(error)
    })
  const webOcComponents: WebOcComponent[] = []
  for (const componentConfig of fewsConfig.components) {
    webOcComponents.push(componentConfig as WebOcComponent)
  }
  return {
    general: fewsConfig.general,
    webOcComponents,
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
  localPath: string,
  remoteResource: string,
) {
  const remoteUrl = getResourcesStaticUrl(remoteResource)
  const localUrl = localPath

  const isHtmlResponse = (response: Response) => {
    const contentType = response.headers.get('Content-Type')
    return contentType?.includes('text/html') ?? false
  }

  let remoteMayBeAvailable = false
  try {
    const remoteResponse = await fetch(remoteUrl, { method: 'HEAD' })
    if (remoteResponse.ok && !isHtmlResponse(remoteResponse)) {
      return remoteUrl
    }
    remoteMayBeAvailable =
      remoteResponse.status === 405 || remoteResponse.status === 501
  } catch (error) {
    console.warn(
      `Could not verify remote resource with HEAD; will try other stylesheet locations: ${remoteUrl}`,
      error,
    )
    remoteMayBeAvailable = true
  }

  try {
    const localResponse = await fetch(localUrl, { method: 'HEAD' })
    if (localResponse.ok && !isHtmlResponse(localResponse)) {
      return localUrl
    }
  } catch (error) {
    console.warn(
      `Could not verify local resource with HEAD: ${localUrl}`,
      error,
    )
  }

  if (remoteMayBeAvailable) return remoteUrl
}
