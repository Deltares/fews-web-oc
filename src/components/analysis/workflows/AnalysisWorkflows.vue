<template>
  <div class="d-flex flex-column h-100">
    <v-tabs
      v-model="selectedFunction"
      variant="outlined"
      density="compact"
      mobile
      class="flex-0-0"
      align-tabs="center"
    >
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :prepend-icon="tab.icon"
        :text="tab.text"
        class="text-none"
      />
    </v-tabs>
    <div class="flex-1-1 overflow-auto">
      <AnalysisWorkflow
        v-if="
          selectedFunction !== undefined &&
          selectedFunction === activeWorkflowToolbox?.id
        "
        :key="activeWorkflowToolbox?.id"
        :customToolBox="activeWorkflowToolbox"
        @addChart="emit('addChart', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AnalysisWorkflow from '@/components/analysis/workflows/AnalysisWorkflow.vue'
import { computed, ref, watch } from 'vue'
import type { CollectionEmits } from '@/lib/analysis'
import type { DataAnalysisDisplayElement } from '@deltares/fews-pi-requests'

interface Props {
  config: DataAnalysisDisplayElement
  isActive?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<CollectionEmits>()

const activeWorkflowToolbox = computed(() =>
  props.config.toolBoxes?.toolboxWorkflows?.find(
    (toolbox) => toolbox.id === selectedFunction.value,
  ),
)

const tabs = computed(() => {
  const toolboxes = props.config.toolBoxes
  const workflowToolboxes = toolboxes?.toolboxWorkflows ?? []
  return workflowToolboxes.map((item) => ({
    value: item.id,
    icon: item.iconId,
    text: item.name,
  }))
})

const selectedFunction = ref(tabs.value[0]?.value)

watch(tabs, resetSelectedFunction)
watch(() => props.isActive, resetSelectedFunction)
function resetSelectedFunction() {
  selectedFunction.value = tabs.value[0]?.value
}
</script>
