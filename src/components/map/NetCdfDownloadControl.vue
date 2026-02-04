<template>
  <Teleport to="body">
    <NetCdfDownloadForm
      v-if="showDialog"
      v-model="showDialog"
      :layer-name="layerName"
      :default-start-time="layerCapabilities?.firstValueTime"
      :default-end-time="layerCapabilities?.lastValueTime"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onMounted, computed, ref } from 'vue'
import { useMap } from '@/services/useMap'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { IControl } from 'maplibre-gl'
import NetCdfDownloadForm from './NetCdfDownloadForm.vue'

interface Props {
  layerName?: string
  layerCapabilities?: {
    firstValueTime?: string | null
    lastValueTime?: string | null
  }
}

const props = defineProps<Props>()

const { map } = useMap()
const settings = useUserSettingsStore()

let control: IControl | null = null
let container: HTMLElement | null = null
const showDialog = ref(false)

function handleButtonClick() {
  showDialog.value = true
}

const createControl = (): IControl => ({
  onAdd(): HTMLElement {
    // Inject a pure HTML button as control element
    container = document.createElement('div')
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group'

    const button = document.createElement('button')
    button.className = 'maplibregl-ctrl-icon'
    button.type = 'button'
    button.title = 'Download NetCDF'
    // SVG icon for download (MDI icon)
    button.innerHTML = `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor;">
      <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>`

    button.addEventListener('click', handleButtonClick)
    container.appendChild(button)

    return container
  },

  onRemove(): void {
    container = null
  },
})

const addControl = () => {
  if (!map || control) return
  control = createControl()
  map.addControl(control, 'top-right')
}

const removeControl = () => {
  if (!map || !control) return
  map.removeControl(control)
  control = null
}

const shouldShowControl = computed(() => {
  return (settings.get('ui.map.tools')?.value ?? false) && !!props.layerName
})

onMounted(() => {
  watch(
    shouldShowControl,
    (enabled) => {
      if (!map) return
      enabled ? addControl() : removeControl()
    },
    { immediate: true },
  )
})

onBeforeUnmount(removeControl)
</script>
