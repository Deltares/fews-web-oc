import { h } from 'vue'
import { configManager } from '@/services/application-config'
import SnapshotStrip from './SnapshotStrip.vue'

// Hourly dates over three days, without a layer so no images are requested
const times = Array.from(
  { length: 3 * 24 },
  (_, i) => new Date(Date.UTC(2025, 0, 1, i)),
)

export const Default = () => {
  configManager.update({
    VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews`,
  })
  return h('div', { style: 'padding-top: 20px; width: 800px' }, [
    h(SnapshotStrip, { times, selectedDate: times[36] }),
  ])
}
