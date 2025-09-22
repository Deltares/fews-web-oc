import { defineStore } from 'pinia'
import { ref } from 'vue'

type SidePanel =
  | 'tasks'
  | 'thresholds'
  | 'info'
  | 'workflows'
  | 'visualize'
  | 'import'

export const useSidePanelStore = defineStore('sidePanel', () => {
  const activeSidePanel = ref<SidePanel>()

  function isActive(sidePanel: SidePanel): boolean {
    return activeSidePanel.value === sidePanel
  }

  function toggleActive(sidePanel: SidePanel): void {
    if (activeSidePanel.value === sidePanel) {
      activeSidePanel.value = undefined
    } else {
      activeSidePanel.value = sidePanel
    }
  }

  function setActive(sidePanel: SidePanel): void {
    activeSidePanel.value = sidePanel
  }

  function close(): void {
    activeSidePanel.value = undefined
  }

  return {
    activeSidePanel,
    isActive,
    toggleActive,
    setActive,
    close,
  }
})
