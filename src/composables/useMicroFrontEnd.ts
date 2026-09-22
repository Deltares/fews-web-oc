import { inject, type InjectionKey } from 'vue'
import { type WebOCMicroFrontEndsResponse } from '@deltares/fews-pi-requests'
import { loadRemote } from '@module-federation/enhanced/runtime'

interface ModuleFederationState {
  config: WebOCMicroFrontEndsResponse
  options: { manifestUrl: string; baseUrl: string }
}

export const MF_REGISTRY_KEY: InjectionKey<ModuleFederationState> =
  Symbol('WebOCMicroFrontEnd')

export function useMicroFrontEnd() {
  const moduleFederation = inject(MF_REGISTRY_KEY)

  function getFrontends() {
    if (!moduleFederation) {
      throw new Error('Module Federation plugin is not installed.')
    }
    return moduleFederation.config.microFrontEnds ?? []
  }

  async function loadWebOCRemote(microFrontEndId: string) {
    const frontends = getFrontends()
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
        `Failed to load Micro Frontend '${microFrontEndId}' (${entryId}): ${reason}`,
      )
    }

    if (!remoteComponent) {
      throw new Error(
        `Micro Frontend '${microFrontEndId}' (${entryId}) did not return a component.`,
      )
    }

    if (typeof remoteComponent === 'object' && 'default' in remoteComponent) {
      return remoteComponent.default
    }

    return remoteComponent
  }

  function getMicroFrontEndIcon(microFrontEndId: string): string {
    const frontends = getFrontends()
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
    const frontends = getFrontends()
    const microFrontEnd = frontends.find(
      (mfe) => microFrontEndIds.includes(mfe.id) && mfe.display === display,
    )
    if (!microFrontEnd) {
      throw new Error(
        `Micro Frontend with display '${display}' not found in the provided IDs.`,
      )
    }
    return microFrontEnd.id
  }

  return {
    loadWebOCRemote,
    getMicroFrontEndIcon,
    getMicroFrontEndId,
  }
}
