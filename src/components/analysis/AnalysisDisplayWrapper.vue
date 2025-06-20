<template>
  <AnalysisDisplayComponent
    v-if="isValidDisplayCollections && displayCollections"
    :collections="displayCollections?.collections"
    :config
    :boundingBox
  />
</template>

<script setup lang="ts">
import {
  createDefaultDisplayCollections,
  DisplayCollections,
  getDateTimeSerializer,
} from '@/lib/analysis'
import AnalysisDisplayComponent from './AnalysisDisplayComponent.vue'
import { ComponentSettings } from '@/lib/topology/componentSettings'
import {
  BoundingBox,
  DataAnalysisDisplayElement,
} from '@deltares/fews-pi-requests'
import { useRemoteStorage } from '@/services/useRemoteStorage'
import { computed, watch } from 'vue'

interface Props {
  config: DataAnalysisDisplayElement
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = defineProps<Props>()

const { state: displayCollections } = useRemoteStorage<DisplayCollections>(
  `weboc-data-analysis-collections-${props.config.id}`,
  createDefaultDisplayCollections(props.config),
  {
    serializer: getDateTimeSerializer(),
  },
)

// TODO: Do a full validation of the displayCollections structure?
const isValidDisplayCollections = computed(
  () => displayCollections.value?.version === '1.0',
)

watch(
  displayCollections,
  (newValue) => {
    if (!newValue) return
    if (!newValue.version || newValue.version !== '1.0') {
      // TODO: Handle version migration if needed
      displayCollections.value = createDefaultDisplayCollections(props.config)
    }
  },
  { immediate: true },
)
</script>
