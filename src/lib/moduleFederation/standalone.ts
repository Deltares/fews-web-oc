import type { ModuleFederationOptions } from './types'

export const isModuleFederationSupported = false
export const buildType = ''
export const unsupportedMicroFrontendMessage =
  'Microfrontends are not supported in this build without Module Federation.'

export function initializeModuleFederation(
  options: ModuleFederationOptions,
): Promise<null> {
  if (options.manifestUrl) {
    console.warn(
      `${unsupportedMicroFrontendMessage} ` +
        'VITE_FEWS_WEBOC_MF_MANIFEST_URL is ignored.',
    )
  }
  return Promise.resolve(null)
}

export function loadRemote(_entryId: string): Promise<unknown> {
  return Promise.reject(new Error(unsupportedMicroFrontendMessage))
}
