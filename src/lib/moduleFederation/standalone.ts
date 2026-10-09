import type { ModuleFederationOptions } from './types'

export const isModuleFederationSupported = false
export const unsupportedMicroFrontendMessage =
  'Micro Frontends are not supported in the standalone build.'

export async function initializeModuleFederation(
  options: ModuleFederationOptions,
): Promise<null> {
  if (options.manifestUrl) {
    console.warn(
      `${unsupportedMicroFrontendMessage} ` +
        'VITE_FEWS_WEBOC_MF_MANIFEST_URL is ignored.',
    )
  }
  return null
}

export async function loadRemote(_entryId: string): Promise<unknown> {
  throw new Error(unsupportedMicroFrontendMessage)
}
