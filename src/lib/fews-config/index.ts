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

export async function isBackendAvailable(timeout?: number) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

  const controller = new AbortController()
  const DEFAULT_TIMEOUT = 5000
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeout ?? DEFAULT_TIMEOUT,
  )

  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(controller),
  })

  try {
    await webServiceProvider.getVersion()
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return false
    }
  }

  clearTimeout(timeoutId)
  return true
}
