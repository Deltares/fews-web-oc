<template>
  <v-menu v-if="nodeButtons.length > 0">
    <template #activator="{ props }">
      <v-btn :variant v-bind="props" class="text-none">
        <v-icon start>mdi-filter-variant</v-icon>
        {{ activeParentName }}
        <v-icon v-if="nodeButtons.length > 1" end>mdi-menu-down</v-icon>
      </v-btn>
    </template>
    <v-list>
      <template v-for="item in nodeButtons">
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
        <v-list-item v-else :to="item.to" @click="activeParentId = item.id">
          {{ item.name }}
          <template #append>
            <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
            <ThresholdInformation
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
import ThresholdInformation from '@/components/general/ThresholdInformation.vue'
import type { VBtn } from 'vuetify/components'

interface Props {
  variant: VBtn['variant']
}

defineProps<Props>()

const activeParentId = defineModel<string>('activeParentId', { required: true })
const nodeButtons = defineModel<ColumnItem[]>('nodeButtons', { required: true })

const activeParentName = computed(() => {
  const activeParent = nodeButtons.value.find(
    (item) => item.id === activeParentId.value,
  )
  return activeParent ? activeParent.name : ''
})
</script>
