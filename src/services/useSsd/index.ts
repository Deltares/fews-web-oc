import {
  datesFromPeriod,
  SsdWebserviceProvider,
} from '@deltares/fews-ssd-requests'
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
  dates: Ref<Date[]>
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
      dates.value = datesFromPeriod(panel.value.dimension.period)
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
