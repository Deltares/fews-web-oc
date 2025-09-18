<template>
  <v-list
    v-model:selected="selectedIndex"
    select-strategy="single-leaf"
    mandatory
    density="compact"
    class="interval-list"
  >
    <v-list-subheader>Period presets</v-list-subheader>
    <v-list-item :value="0" tabindex="1">
      Default
      <template v-slot:prepend="{ isSelected, select }">
        <v-list-item-action start tabindex="-1">
          <v-checkbox-btn
            :model-value="isSelected"
            @update:model-value="select"
            true-icon="mdi-circle-small"
            false-icon=""
            indeterminate-icon=""
            density="compact"
            tabindex="-1"
          ></v-checkbox-btn>
        </v-list-item-action>
      </template>
    </v-list-item>
    <v-list-item :value="1">
      Custom
      <template v-slot:prepend="{ isSelected, select }">
        <v-list-item-action start tabindex="-1">
          <v-checkbox-btn
            :model-value="isSelected"
            @update:model-value="select"
            true-icon="mdi-circle-small"
            false-icon=""
            indeterminate-icon=""
            density="compact"
            tabindex="-1"
          ></v-checkbox-btn>
        </v-list-item-action>
      </template>
    </v-list-item>
    <template v-if="props.items.length">
      <v-divider />
      <v-list-item
        v-for="(item, index) in props.items"
        :key="index"
        :value="index + 2"
      >
        {{ item.label }}
        <template v-slot:prepend="{ isSelected, select }">
          <v-list-item-action start tabindex="-1">
            <v-checkbox-btn
              :model-value="isSelected"
              @update:model-value="select"
              true-icon="mdi-circle-small"
              false-icon=""
              indeterminate-icon=""
              density="compact"
              tabindex="-1"
            ></v-checkbox-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import type { LabeledIntervalItem, Interval } from '@/lib/TimeControl/interval'
import { isEqual } from 'lodash-es'
import { onBeforeMount, ref, watch } from 'vue'

interface Props {
  items: LabeledIntervalItem[]
  now: Date
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  now: () => new Date(),
})

const interval = defineModel<Interval>({ required: true })
const selectedIndex = ref([0])

onBeforeMount(() => {
  updateIndex(interval.value)
})

watch(selectedIndex, (newValue) => {
  onSelectInterval(newValue[0])
})

const onSelectInterval = (index: number) => {
  if (index === 0) {
    interval.value = 'default'
  } else if (index === 1) {
    interval.value = 'custom'
  } else {
    interval.value = props.items[index - 2]
  }
}

function updateIndex(newValue: Interval) {
  if (newValue === 'default') {
    selectedIndex.value = [0]
  } else if (newValue === 'custom' || newValue === undefined) {
    selectedIndex.value = [1]
  } else {
    selectedIndex.value = [
      props.items.findIndex((entry) => isEqual(entry, newValue)) + 2,
    ]
  }
}

watch(interval, (newValue) => updateIndex(newValue))
</script>

<style scoped>
.interval-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
