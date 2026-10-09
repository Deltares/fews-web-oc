import {
  type MicroFrontendRegistry,
  type ModuleFederationOptions,
} from './types'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import { type RemoteWithEntry } from '@module-federation/sdk'

export { loadRemote } from '@module-federation/enhanced/runtime'
export const isModuleFederationSupported = true
export const buildType = 'Micro Frontends'
export const unsupportedMicroFrontendMessage =
  'Microfrontends are not supported in this build without Module Federation.'

export async function initializeModuleFederation(
  options: ModuleFederationOptions,
): Promise<MicroFrontendRegistry> {
  if (!options.manifestUrl) {
    throw new Error('Module Federation: Missing manifest URL configuration.')
  }

  const response = await fetch(options.manifestUrl)

  if (!response.ok) {
    throw new Error(
      `Module Federation: Failed to fetch manifest ` +
        `(${response.status} ${response.statusText}).`,
    )
  }

  const manifest = await response.json()

  const remotes: RemoteWithEntry[] = manifest.remotes ?? []

  registerRemotes(remotes)

  const piProvider = new PiWebserviceProvider(options.baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const config = await piProvider.getMicroFrontEnds({})

  return {
    config,
    options,
    remotes,
  }
}
