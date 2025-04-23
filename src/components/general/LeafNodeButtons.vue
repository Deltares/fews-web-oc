<template>
  <v-menu v-if="items.length > 0">
    <template #activator="{ props }">
      <v-btn :variant v-bind="props" class="text-none">
        <v-icon start>mdi-filter-variant</v-icon>
        {{ activeNode?.name || 'All' }}
        <v-icon v-if="items.length > 1" end>mdi-menu-down</v-icon>
      </v-btn>
    </template>
    <v-list>
      <template v-for="item in items">
        <v-list-item
          v-if="item.href"
          :href="item.href"
          :target="item.href ? '_blank' : undefined"
        >
          {{ item.name }}
          <template #append>
            <v-icon size="xsmall">{{ item.icon }}</v-icon>
          </template>
        </v-list-item>
        <v-list-item v-else :to="item.to" @click="activeNodeId = item.id">
          {{ item.name }}
          <template #append>
            <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
            <ThresholdSummaryChip
              :icon="item.thresholdIcon"
              :count="item.thresholdCount"
            />
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { ColumnItem } from '@/components/general/ColumnItem'
import ThresholdSummaryChip from '@/components/thresholds/ThresholdSummaryChip.vue'
import type { VBtn } from 'vuetify/components'

interface Props {
  variant: VBtn['variant']
  items: ColumnItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const activeNodeId = defineModel<string>('activeNodeId', { required: true })

const activeNode = computed(() => {
  const node = props.items.find((item) => item.id === activeNodeId.value)
  return node
})
</script>
