import { SidePanelType } from '@/lib/topology/sidePanel'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidePanelStore = defineStore('sidePanel', () => {
  const activeSidePanel = ref<SidePanelType>()

  function isActive(sidePanel: SidePanelType): boolean {
    return activeSidePanel.value === sidePanel
  }

  function toggleActive(sidePanel: SidePanelType): void {
    if (activeSidePanel.value === sidePanel) {
      activeSidePanel.value = undefined
    } else {
      activeSidePanel.value = sidePanel
    }
  }

  function setActive(sidePanel: SidePanelType): void {
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
