<template>
  <v-list class="interval-list" density="compact" prepend-gap="12">
    <v-list-subheader>{{ $t('timeControl.period') }}</v-list-subheader>
    <v-list-item
      density="compact"
      :lines="false"
      :active="0 === selectedIndex"
      :title="$t('common.default')"
      :subtitle="getSubtitle(0)"
      prepend-icon="mdi-clock-outline"
      @click="onSelectInterval(0)"
    />
    <v-list-item
      density="compact"
      :lines="false"
      :active="1 === selectedIndex"
      :title="$t('common.custom')"
      :subtitle="getSubtitle(1)"
      prepend-icon="mdi-calendar-range"
      @click="onSelectInterval(1)"
    />
    <template v-if="props.items.length">
      <v-divider></v-divider>
      <v-list-subheader>{{ $t('timeControl.periodPresets') }}</v-list-subheader>
      <v-list-item
        v-for="(item, index) in props.items"
        :key="index"
        density="compact"
        :lines="false"
        :active="index === selectedIndex - 2"
        :title="item.label"
        :subtitle="getSubtitle(index + 2)"
        prepend-icon="mdi-update"
        @click="onSelectInterval(index + 2)"
      />
    </template>
  </v-list>
</template>

<script setup lang="ts">
import type { LabeledIntervalItem, Interval } from '@/lib/TimeControl/interval'
import { isEqual } from 'lodash-es'
import { onBeforeMount, ref, watch } from 'vue'

interface Props {
  items?: LabeledIntervalItem[]
  now?: Date
  /** Shown as second line of the selected item, e.g. its period. */
  selectedDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  now: () => new Date(),
})

const interval = defineModel<Interval>({ required: true })
const selectedIndex = ref(0)

onBeforeMount(() => {
  updateIndex(interval.value)
})

function getSubtitle(index: number): string | undefined {
  return index === selectedIndex.value ? props.selectedDescription : undefined
}

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
    selectedIndex.value = 0
  } else if (newValue === 'custom' || newValue === undefined) {
    selectedIndex.value = 1
  } else {
    selectedIndex.value =
      props.items.findIndex((entry) => isEqual(entry, newValue)) + 2
  }
}

watch(interval, (newValue) => updateIndex(newValue))
</script>

<style scoped>
.interval-list {
  max-height: 400px;
  overflow-y: auto;
}

/* Show the whole period of the selected item */
.interval-list :deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  white-space: normal;
}
</style>
