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
  if (!moduleFederation) {
    throw new Error('Module Federation plugin is not installed.')
  }
  const frontends = moduleFederation.config.microFrontEnds ?? []

  async function loadWebOCRemote(microFrontEndId: string) {
    const microFrontEnd = frontends.find((mfe) => mfe.id === microFrontEndId)
    if (!microFrontEnd) {
      throw new Error(`Micro Frontend with ID ${microFrontEndId} not found.`)
    }
    const entryId = `${microFrontEnd.remoteId}/${microFrontEnd.componentId}`

    const remoteComponent = await loadRemote(entryId)
    if (!remoteComponent) return

    if (typeof remoteComponent === 'object' && 'default' in remoteComponent) {
      return remoteComponent.default
    }

    return remoteComponent
  }

  function getMicroFrontEndIcon(microFrontEndId: string): string {
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
