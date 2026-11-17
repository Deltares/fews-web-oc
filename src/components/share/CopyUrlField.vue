<template>
  <v-text-field
    :model-value="url"
    readonly
    hide-details
    density="compact"
    ref="field"
    @focus="selectEmbedUrl"
    :disabled="!url"
    variant="outlined"
    class="text-mono"
  >
    <template #append-inner>
      <CopyUrlButton :url="url" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import CopyUrlButton from './CopyUrlButton.vue'
import { useTemplateRef } from 'vue'

interface Props {
  url: string
}
const props = defineProps<Props>()

const field = useTemplateRef('field')

function selectEmbedUrl() {
  field.value?.select()
}
</script>
