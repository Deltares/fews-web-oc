<template>
  <v-list class="interval-list" density="compact">
    <v-list-item :active="0 === selectedIndex" @click="onSelectInterval(0)">
      Default
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
    <v-list-item :active="1 === selectedIndex">
      Custom
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
    <v-divider></v-divider>
    <v-list-item
      v-for="(item, index) in props.items"
      :key="index"
      :active="index === selectedIndex - 2"
      @click="onSelectInterval(index + 2)"
    >
      {{ intervalToLocaleString(item) }}
      <template v-slot:append="{ isActive }">
        <v-icon v-show="isActive" small> mdi-check </v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { DateTime, Duration } from 'luxon'
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  items: string[]
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

const intervalToLocaleString = (interval: string) => {
  const duration = Duration.fromISO(interval)
  const startDateTime = DateTime.fromJSDate(props.now).plus(duration)
  return startDateTime.toRelative( { unit: ['months', 'weeks', 'days']})
}

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

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === 'default') {
      selectedIndex.value = 0
     } else if (newValue === undefined) {
      selectedIndex.value = 1
    } else {
      selectedIndex.value =
        props.items.findIndex((entry) => entry === newValue) + 2
    }
  },
)
</script>

<style scoped>
.interval-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
