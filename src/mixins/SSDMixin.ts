import { Vue, Component } from 'vue-property-decorator'
import { datesFromPeriod, SsdWebserviceProvider, Capabilities, DisplayGroup, DisplayPanel } from '@deltares/fews-ssd-requests' // eslint-disable-line no-unused-vars

@Component
export default class SSDMixin extends Vue {
  capabilities: Capabilities = { title: '', displayGroups: [] }
  currentGroup: DisplayGroup = { name: '', title: '', displayPanels: [] }
  currentPanel: DisplayPanel = { title: '', name: '' }
  excludedGroupsNames: string[] = []
  dates: Date[] = []
  title: string = ''
  timeIndex: Date | null = null
  ssdProvider!: SsdWebserviceProvider
  baseUrl: string = ''
  readonly GRACE_PERIOD = 0

  status = {
    loading: false,
    error: false,
    message: ''
  }

  async created (): Promise<void> {
    let url!: URL
    this.baseUrl = this.$config.get('VITE_APP_FEWS_WEBSERVICES_URL')
    try {
      url = new URL(this.baseUrl)
    } catch (error) {
      if (error instanceof TypeError) {
        url = new URL(this.baseUrl, document.baseURI)
      }
    }
    this.ssdProvider = new SsdWebserviceProvider(url.toString())
    await this.init()
  }

  async init (): Promise<void> {
    await this.loadCapabilities()
    this.setTimeIndex()
  }

  async loadCapabilities (): Promise<void> {
    this.status.loading = true
    try {
      this.capabilities = await this.ssdProvider.getCapabilities()
    } catch (error) {
      this.status.error = true
      this.status.message = 'error-loading'
    }
    this.status.loading = false
  }

  selectPanel (name: string): void {
    const panel = this.currentGroup.displayPanels.find((p: any) => { return p.name === name })
    if (panel) {
      this.currentPanel = panel
      if (!this.currentPanel.dimension) {
        return
      }
      this.dates = datesFromPeriod(this.currentPanel.dimension?.period)
    }
  }

  selectGroup (name: string): boolean {
    const group = this.capabilities.displayGroups.find((g) => { return g.name === name })
    if (group) {
      this.currentGroup = group
      this.title = group.title
      return true
    }
    return false
  }

  setTimeIndex (): void {
    const now = this.currentPanel.dimension?.default ? new Date(this.currentPanel.dimension?.default) : new Date()
    if (!this.currentPanel.dimension) {
      return
    }
    this.dates = datesFromPeriod(this.currentPanel.dimension?.period)
    const index = this.dates.findIndex((date: Date) => {
      return date.getTime() + this.GRACE_PERIOD >= now.getTime()
    })
    if (index === -1) {
      if (this.dates[0].getTime() > now.getTime()) {
        this.timeIndex = this.dates[0]
      } else {
        this.timeIndex = this.dates[this.dates.length - 1]
      }
    } else {
      this.timeIndex = this.dates[index]
    }
  }
}
