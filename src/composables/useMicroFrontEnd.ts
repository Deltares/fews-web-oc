import { inject, type InjectionKey } from 'vue'
import { WebOCMicroFrontEndsResponse } from '@deltares/fews-pi-requests'
import { getInstance } from '@module-federation/enhanced/runtime'

interface ModuleFederationState {
  config: {
    microFrontEnds: Required<WebOCMicroFrontEndsResponse>['microFrontEnds']
  }
  options: { manifestUrl: string; baseUrl: string }
}

export const MF_REGISTRY_KEY: InjectionKey<ModuleFederationState> = Symbol('WebOCMicroFrontEnd')

export function useMicroFrontEnd() {
  const moduleFederation = inject(MF_REGISTRY_KEY)
  if (!moduleFederation) {
    throw new Error('Module Federation plugin is not installed.')
  }

  async function loadWebOCRemote(microFrontEndId: string) {
    const microFrontEnd = moduleFederation!.config.microFrontEnds.find(
      (mfe) => mfe.id === microFrontEndId,
    )
    if (!microFrontEnd) {
      throw new Error(`Micro Frontend with ID ${microFrontEndId} not found.`)
    }
    const entryId = `${microFrontEnd.remoteId}/${microFrontEnd.componentId}`
    const instance = getInstance()
    const remoteComponent = await instance.loadRemote(entryId) as any
    return remoteComponent.default
  }

  function getMicroFrontEndIcon(microFrontEndId: string): string {
    const microFrontEnd = moduleFederation!.config.microFrontEnds.find(
      (mfe) => mfe.id === microFrontEndId,
    )
    if (!microFrontEnd) {
      throw new Error(`Micro Frontend with ID ${microFrontEndId} not found.`)
    }
    return microFrontEnd.icon || ''
  }

  function getMicroFrontEndId(microFrontEndIds: string[], display: string): string {
    const microFrontEnd = moduleFederation!.config.microFrontEnds.find(
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
