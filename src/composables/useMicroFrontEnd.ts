import { inject, type InjectionKey } from 'vue'
import {
  isModuleFederationSupported,
  loadRemote,
  unsupportedMicroFrontendMessage,
} from '@weboc/module-federation'
import type {
  MicroFrontendRegistry,
  MicroFrontendRemote,
} from '@/lib/moduleFederation/types'
export type {
  MicroFrontendRegistry,
  ModuleFederationOptions,
} from '@/lib/moduleFederation/types'

export const MF_REGISTRY_KEY: InjectionKey<MicroFrontendRegistry> =
  Symbol('WebOCMicroFrontEnd')

export function useMicroFrontEnd() {
  const moduleFederation = inject(MF_REGISTRY_KEY, null)

  const isEnabled = isModuleFederationSupported && moduleFederation !== null

  function microFrontEndConfig() {
    return isEnabled ? (moduleFederation?.config.microFrontEnds ?? []) : []
  }

  function getRemotes(): MicroFrontendRemote[] {
    return isEnabled ? (moduleFederation?.remotes ?? []) : []
  }

  async function loadWebOCRemote(microFrontEndId: string) {
    if (!isModuleFederationSupported) {
      throw new Error(unsupportedMicroFrontendMessage)
    }
    if (!moduleFederation) {
      throw new Error(
        'Module Federation is not configured. ' +
          'VITE_FEWS_WEBOC_MF_MANIFEST_URL is not configured.',
      )
    }

    const frontends = microFrontEndConfig()

    const microFrontEnd = frontends.find((mfe) => mfe.id === microFrontEndId)

    if (!microFrontEnd) {
      throw new Error(`Micro Frontend with ID ${microFrontEndId} not found.`)
    }

    const entryId = `${microFrontEnd.remoteId}/${microFrontEnd.componentId}`

    let remoteComponent: unknown

    try {
      remoteComponent = await loadRemote(entryId)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)

      throw new Error(
        `Failed to load Micro Frontend '${microFrontEndId}' ` +
          `(${entryId}): ${reason}`,
      )
    }

    if (!remoteComponent) {
      throw new Error(
        `Micro Frontend '${microFrontEndId}' ` +
          `(${entryId}) did not return a component.`,
      )
    }

    if (typeof remoteComponent === 'object' && 'default' in remoteComponent) {
      return remoteComponent.default
    }

    return remoteComponent
  }

  function getMicroFrontEndIcon(microFrontEndId: string): string {
    const frontends = microFrontEndConfig()

    const microFrontEnd = frontends.find((mfe) => mfe.id === microFrontEndId)

    if (!microFrontEnd) {
      throw new Error(`Micro Frontend with ID ${microFrontEndId} not found.`)
    }

    return microFrontEnd.icon
  }

  function getMicroFrontEndId(
    microFrontEndIds: string[],
    display: string,
  ): string {
    const frontends = microFrontEndConfig()

    const microFrontEnd = frontends.find(
      (mfe) => microFrontEndIds.includes(mfe.id) && mfe.display === display,
    )

    if (!microFrontEnd) {
      throw new Error(
        `Micro Frontend with display '${display}' ` +
          'not found in the provided IDs.',
      )
    }

    return microFrontEnd.id
  }

  return {
    isSupported: isModuleFederationSupported,
    unsupportedMicroFrontendMessage,
    isEnabled,
    microFrontEndConfig,
    getRemotes,
    loadWebOCRemote,
    getMicroFrontEndIcon,
    getMicroFrontEndId,
  }
}
