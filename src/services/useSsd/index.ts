import { SsdWebserviceProvider } from '@deltares/fews-ssd-requests'
import type {
  Capabilities,
  DisplayGroup,
  DisplayPanel,
} from '@deltares/fews-ssd-requests'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl.ts'
import type { MaybeRefOrGetter, Ref } from 'vue'

export interface UseSsdReturn {
  error: Ref<any>
  capabilities: Ref<Capabilities | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  src: Ref<string>
  group: Ref<DisplayGroup | undefined>
  panel: Ref<DisplayPanel | undefined>
}

function findGroup(
  capabilities: Capabilities,
  name: string,
): DisplayGroup | undefined {
  return capabilities.displayGroups.find((g) => {
    return g.name === name
  })
}

function findPanel(
  group: DisplayGroup,
  name: string,
): DisplayPanel | undefined {
  return group.displayPanels.find((g) => {
    return g.name === name
  })
}

export function useSsd(
  baseUrl: string,
  groupId: MaybeRefOrGetter<string>,
  panelId: MaybeRefOrGetter<string>,
  time: MaybeRefOrGetter<string>,
): UseSsdReturn {
  const ssdProvider = new SsdWebserviceProvider(baseUrl)

  const isReady = ref(false)
  const isLoading = ref(false)
  const capabilities = ref<Capabilities>()
  const error = shallowRef<unknown | undefined>(undefined)
  const src = ref('')
  const group = ref<DisplayGroup>()
  const panel = ref<DisplayPanel>()

  async function loadCapabilities(): Promise<void> {
    isLoading.value = true
    isReady.value = false

    try {
      capabilities.value = await ssdProvider.getCapabilities()
    } catch (error) {
      error = 'error-loading'
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  loadCapabilities()

  watchEffect(() => {
    let result = ''
    const gId = toValue(groupId)
    const pId = toValue(panelId)
    const t = toValue(time)
    const c = capabilities.value
    if (c) {
      const g = findGroup(c, gId)
      group.value = g
      if (g) panel.value = findPanel(g, pId)
    }

    if (pId) {
      result = absoluteUrl(
        `${baseUrl}/ssd?request=GetDisplay&ssd=${pId}`,
      ).toString()
      if (t) result = result + `&time=${t}`
    }
    src.value = result
  })

  const shell = {
    capabilities,
    isReady,
    isLoading,
    error,
    src,
    group,
    panel,
  }

  return shell
}
