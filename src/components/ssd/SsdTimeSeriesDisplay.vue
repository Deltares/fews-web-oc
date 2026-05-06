<template>
  <WindowComponent>
    <template v-slot:toolbar>
      <v-toolbar-items mandatory>
        <v-btn
          v-for="item in displayTypeItems"
          :key="item.value"
          :value="item.value"
          :aria-label="item.label"
          :text="item.label"
          :active="displayType === item.value"
          size="small"
          @click="displayType = item.value"
        >
          <v-icon>{{ item.icon }}</v-icon>
        </v-btn>
      </v-toolbar-items>
      <span class="mx-5">{{ displayConfig?.title }}</span>
      <v-spacer />
    </template>
    <template v-slot:toolbar-append>
      <v-btn size="small" variant="text" @click="onClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
    <TimeSeriesComponent :config="displayConfig" :displayType="displayType">
    </TimeSeriesComponent>
  </WindowComponent>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { useSsdPi, UseSsdPiOptions } from '@/services/useSsdPi/index.ts'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import { DisplayType } from '@/lib/display/DisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  panelId?: string
  objectId?: string
}

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
}

const props = withDefaults(defineProps<Props>(), {
  panelId: '',
  objectId: '',
})

const emit = defineEmits<{ (e: 'close', objectId: string): void }>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const settings = useUserSettingsStore()

const options = computed<UseSsdPiOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
})

const displayType = ref(DisplayType.TimeSeriesChart)
const displayTypeItems: DisplayTypeItem[] = [
  {
    icon: 'mdi-chart-line',
    label: 'Chart',
    value: DisplayType.TimeSeriesChart,
  },
  {
    icon: 'mdi-table',
    label: 'Table',
    value: DisplayType.TimeSeriesTable,
  },
]

const { displayConfig } = useSsdPi(
  baseUrl,
  () => props.panelId,
  () => props.objectId,
  options,
)

watch(
  () => displayConfig,
  () => {
    if (!displayConfig.value) return

    if (displayConfig.value.subplots.length < 1) {
      onClose()
    }
  },
  { deep: true },
)

function onClose(): void {
  emit('close', props.objectId)
}
</script>
