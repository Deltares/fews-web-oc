import {
  datesFromPeriod,
  SsdWebserviceProvider,
  type SsdGetCapabilitiesResponse,
  type SsdDisplayGroup,
  type SsdDisplayPanel,
} from '@deltares/fews-ssd-requests'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl.ts'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { transformRequestFn } from '@/lib/requests/transformRequest'
export interface UseSsdReturn {
  error: Ref<any>
  capabilities: Ref<SsdGetCapabilitiesResponse | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  src: Ref<string>
  group: Ref<SsdDisplayGroup | undefined>
  panel: Ref<SsdDisplayPanel | undefined>
  dates: Ref<Date[]>
}

function findGroup(
  capabilities: SsdGetCapabilitiesResponse,
  name: string,
): SsdDisplayGroup | undefined {
  return capabilities.displayGroups.find((g) => {
    return g.name === name
  })
}

function findPanel(
  group: SsdDisplayGroup,
  name: string,
): SsdDisplayPanel | undefined {
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
  const ssdProvider = new SsdWebserviceProvider(baseUrl, {
    transformRequestFn: transformRequestFn(),
  })

  const isReady = ref(false)
  const isLoading = ref(false)
  const capabilities = ref<SsdGetCapabilitiesResponse>()
  const error = shallowRef<unknown | undefined>(undefined)
  const src = ref('')
  const group = ref<SsdDisplayGroup>()
  const panel = ref<SsdDisplayPanel>()
  const dates = ref<Date[]>([])

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
    const groupIdValue = toValue(groupId)
    const panelIdValue = toValue(panelId)
    const capabilitiesValue = capabilities.value

    if (!capabilitiesValue) return

    // Find the group and panel by ID in the capabilities.
    group.value = findGroup(capabilitiesValue, groupIdValue)
    if (group.value) panel.value = findPanel(group.value, panelIdValue)

    if (!panel.value) return

    // Update the available dates for this display.
    if (panel.value.dimension) {
      if (panel.value.dimension.period) {
        dates.value = datesFromPeriod(panel.value.dimension.period)
      }
    }

    // Update the source URL based on the found panel.
    let sourceUrl = absoluteUrl(
      `${baseUrl}/ssd?request=GetDisplay&ssd=${panelIdValue}`,
    ).toString()
    // If specified, add a time value.
    const timeValue = toValue(time)
    if (timeValue) sourceUrl += `&time=${timeValue}`

    src.value = sourceUrl
  })

  return {
    capabilities,
    isReady,
    isLoading,
    error,
    src,
    group,
    panel,
    dates,
  }
}
