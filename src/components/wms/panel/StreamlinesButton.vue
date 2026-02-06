<template>
  <v-btn
    @click="toggleLayerType"
    icon
    density="compact"
    variant="plain"
    :color="doAnimateStreamlines ? 'primary' : undefined"
    class="me-2"
  >
    <v-progress-circular v-if="isLoading" size="20" indeterminate />
    <v-icon v-else>mdi-animation-play</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { LayerKind } from '@/lib/streamlines'
import { useUserSettingsStore } from '@/stores/userSettings'
import { computed, nextTick } from 'vue'

interface Props {
  isLoading: boolean
}
defineProps<Props>()

const layerKind = defineModel<LayerKind>('layerKind', { required: true })

const userSettingsStore = useUserSettingsStore()

const doAnimateStreamlines = computed<boolean>({
  get: () => layerKind.value === LayerKind.Streamline,
  set: (doAnimate) => {
    layerKind.value = doAnimate ? LayerKind.Streamline : LayerKind.Static
  },
})

function toggleLayerType(): void {
  doAnimateStreamlines.value = !doAnimateStreamlines.value

  // If we are in this function, the user manually selected a layer kind, so
  // store their preference. Wait for the layerkind to update based on the
  // change in the doAnimateStreamlines boolean, then store the newly updated
  // layerKind.
  nextTick(() => {
    userSettingsStore.preferredLayerKind = layerKind.value
  })
}
</script>
