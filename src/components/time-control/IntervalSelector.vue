<template>
  <v-list class="interval-list" density="compact">
    <v-list-item :active="0 === selectedIndex" @click="onSelectInterval(0)">
      Default
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
    <v-list-item
      :active="1 === selectedIndex"
      @click="onSelectInterval(1)"
      disabled
    >
      Custom
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
    <v-divider></v-divider>
    <v-list-subheader>Period presets</v-list-subheader>
    <v-list-item
      v-for="(item, index) in props.items"
      :key="index"
      :active="index === selectedIndex - 2"
      @click="onSelectInterval(index + 2)"
    >
      {{ item.label }}
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import type { IntervalItem, Interval } from '@/lib/TimeControl/interval'
import { isEqual } from 'lodash-es'
import { onBeforeMount, ref, watch } from 'vue'

interface Props {
  modelValue: Interval | undefined
  items: IntervalItem[]
  now: Date
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'default',
  items: () => {
    return []
  },
  now: () => new Date(),
})

const emit = defineEmits(['update:modelValue'])
const selectedIndex = ref(0)

onBeforeMount(() => {
  updateIndex(props.modelValue)
})

const onSelectInterval = (index: number) => {
  let selectedInterval = undefined
  if (index === 0) {
    selectedInterval = 'default'
  } else if (index === 1) {
    selectedInterval = 'custom'
  } else {
    selectedInterval = props.items[index - 2]
  }
  emit('update:modelValue', selectedInterval)
}

function updateIndex(newValue: Interval | undefined) {
  if (newValue === 'default') {
    selectedIndex.value = 0
  } else if (newValue === 'custom' || newValue === undefined) {
    selectedIndex.value = 1
  } else {
    selectedIndex.value =
      props.items.findIndex((entry) => isEqual(entry, newValue)) + 2
  }
}

watch(
  () => props.modelValue,
  (newValue) => updateIndex(newValue),
)
</script>

<style scoped>
.interval-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
