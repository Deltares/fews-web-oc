import { configManager } from '../../services/application-config'
import type { ApplicationConfig } from '../../services/application-config/ApplicationConfig.js'
import { getResourcesStaticUrl } from '../fews-config/index.js'
import { BASE_URL } from './startup-constants.js'

export function createHeadLink(rel: string, href: string): HTMLLinkElement {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  document.head.appendChild(link)
  return link
}

export function resolveConfiguredResource(
  configKey: keyof ApplicationConfig,
  fallbackPath: string,
): string {
  const resource = configManager.getWithDefault(configKey, '')
  return typeof resource === 'string' && resource.length > 0
    ? getResourcesStaticUrl(resource)
    : `${BASE_URL}${fallbackPath}`
}

export function appendConfiguredHeadLinks(): void {
  createHeadLink(
    'stylesheet',
    resolveConfiguredResource('VITE_LOGIN_STYLESHEET_URL', 'css/login.css'),
  )

  createHeadLink(
    'manifest',
    resolveConfiguredResource('VITE_APP_MANIFEST_URL', 'app.webmanifest'),
  )
}
