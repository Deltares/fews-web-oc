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
  validateDisplayCollections,
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

const isValidDisplayCollections = computed(() =>
  displayCollections.value
    ? validateDisplayCollections(displayCollections.value)
    : false,
)

// HACK: We watch displayCollections object and set it to a default value
//       if the version is not present or '1.0'. Hack since this function will run again
//       when the object is set to a default value. In the future, we should handle version migrations here.
watch(
  () => displayCollections.value?.version,
  (newVersion) => {
    if (!newVersion || newVersion !== '1.0') {
      // In the future handle version migrations here
      displayCollections.value = createDefaultDisplayCollections(props.config)
    }
  },
  { immediate: true },
)
</script>
