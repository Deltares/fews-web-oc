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

/**
 * Reactive async state. Will not block your setup function and will trigger changes once
 * the promise is ready.
 *
 * @see https://vueuse.org/useAsyncState
 * @param url    The initial state, used until the first evaluation finishes
 * @param options
 */
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

// @Component
// export default class SSDMixin extends Vue {
//   capabilities: Capabilities = { title: '', displayGroups: [] }
//   currentGroup: DisplayGroup = { name: '', title: '', displayPanels: [] }
//   currentPanel: DisplayPanel = { title: '', name: '' }
//   excludedGroupsNames: string[] = []
//   dates: Date[] = []
//   title: string = ''
//   timeIndex: Date | null = null
//   ssdProvider!: SsdWebserviceProvider
//   baseUrl: string = ''
//   readonly GRACE_PERIOD = 0

//   status = {
//     loading: false,
//     error: false,
//     message: ''
//   }

//   async created (): Promise<void> {
//     let url!: URL
//     this.baseUrl =
//     try {
//       url = new URL(this.baseUrl)
//     } catch (error) {
//       if (error instanceof TypeError) {
//         url = new URL(this.baseUrl, document.baseURI)
//       }
//     }
//     await this.init()
//   }

//   async init (): Promise<void> {
//     this.setTimeIndex()
//   }

//   selectPanel (name: string): void {
//     const panel = this.currentGroup.displayPanels.find((p: any) => { return p.name === name })
//     if (panel) {
//       this.currentPanel = panel
//       if (!this.currentPanel.dimension) {
//         return
//       }
//       this.dates = datesFromPeriod(this.currentPanel.dimension?.period)
//     }
//   }

//   selectGroup (name: string): boolean {
//     const group = this.capabilities.displayGroups.find((g) => { return g.name === name })
//     if (group) {
//       this.currentGroup = group
//       this.title = group.title
//       return true
//     }
//     return false
//   }

//   setTimeIndex (): void {
//     const now = this.currentPanel.dimension?.default ? new Date(this.currentPanel.dimension?.default) : new Date()
//     if (!this.currentPanel.dimension) {
//       return
//     }
//     this.dates = datesFromPeriod(this.currentPanel.dimension?.period)
//     const index = this.dates.findIndex((date: Date) => {
//       return date.getTime() + this.GRACE_PERIOD >= now.getTime()
//     })
//     if (index === -1) {
//       if (this.dates[0].getTime() > now.getTime()) {
//         this.timeIndex = this.dates[0]
//       } else {
//         this.timeIndex = this.dates[this.dates.length - 1]
//       }
//     } else {
//       this.timeIndex = this.dates[index]
//     }
//   }
// }
