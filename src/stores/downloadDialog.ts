import { defineStore } from 'pinia'

interface DownloadDialogState {
  disabled: boolean
  showDialog: boolean
}

export const useDownloadDialogStore = defineStore('downloadDialog', {
  state: (): DownloadDialogState => ({
    disabled: true,
    showDialog: false,
  }),

  actions: {
    setDisabled(disabled: boolean) {
      this.disabled = disabled
    },
  },
})
