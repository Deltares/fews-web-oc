import {
  datesFromPeriod,
  SsdWebserviceProvider,
  type SsdGetCapabilitiesResponse,
  type SsdDisplayPanel,
} from '@deltares/fews-ssd-requests'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl.ts'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
export interface UseSsdReturn {
  error: Ref<any>
  capabilities: Ref<SsdGetCapabilitiesResponse | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  src: Ref<string>
  panel: Ref<SsdDisplayPanel | undefined>
  dates: Ref<Date[]>
}

const REFRESH_INTERVAL = 1000 * 60 * 5 // 5 minutes

function findPanel(
  capabilities: SsdGetCapabilitiesResponse,
  name: string,
): SsdDisplayPanel | undefined {
  return capabilities.displayGroups
    .flatMap((g) => g.displayPanels)
    .find((p) => {
      return p.name === name
    })
}

export function useSsd(
  baseUrl: string,
  panelId: MaybeRefOrGetter<string>,
  time: MaybeRefOrGetter<string>,
): UseSsdReturn {
  const ssdProvider = new SsdWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const isReady = ref(false)
  const isLoading = ref(false)
  const capabilities = ref<SsdGetCapabilitiesResponse>()
  const error = shallowRef<unknown | undefined>(undefined)
  const src = ref('')
  const panel = ref<SsdDisplayPanel>()
  const dates = ref<Date[]>([])

  function reset() {
    src.value = ''
    panel.value = undefined
    dates.value = []
  }

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
  setInterval(loadCapabilities, REFRESH_INTERVAL)

  watchEffect(() => {
    const panelIdValue = toValue(panelId)
    const capabilitiesValue = capabilities.value

    if (!capabilitiesValue) {
      reset()
      return
    }

    // Find the panel by ID in the capabilities.
    panel.value = findPanel(capabilitiesValue, panelIdValue)

    if (!panel.value) {
      reset()
      return
    }

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
    panel,
    dates,
  }
}
