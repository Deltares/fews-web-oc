<template>
  <ControlChip>
    <v-btn
      @click="showLayer = !showLayer"
      density="compact"
      variant="plain"
      icon
    >
      <v-icon>{{ showLayer ? 'mdi-layers' : 'mdi-layers-off' }}</v-icon>
    </v-btn>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      v-if="showLayer"
    >
      <template v-slot:activator="{ props }">
        <v-btn variant="plain" v-bind="props" class="pe-0 text-none">
          <span
            class="me-2"
            :class="{ 'text-decoration-line-through': props.completelyMissing }"
            >{{ layerTitle }}</span
          >
        </v-btn>
      </template>
      <v-list class="information-panel-list">
        <v-list-item
          :title="props.layerTitle"
          :subtitle="analysisTime"
          prepend-icon="mdi-layers"
        >
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :title="'Time range'"
          :subtitle="formattedTimeRange"
          prepend-icon="mdi-clock-time-four-outline"
        >
        </v-list-item>

        <slot></slot>

        <v-list-item v-if="canUseStreamlines" prepend-icon="mdi-animation-play">
          <v-list-item-title>Animate</v-list-item-title>
          <template v-slot:append>
            <v-switch
              density="compact"
              v-model="animate"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn
      v-if="showLayer && canUseStreamlines"
      @click="switchLayerType"
      icon
      density="compact"
      variant="plain"
      :color="animate ? 'primary' : undefined"
    >
      <v-progress-circular v-if="isLoading" size="20" indeterminate />
      <v-icon v-else>mdi-animation-play</v-icon>
    </v-btn>
  </ControlChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { LayerKind } from '@/lib/streamlines'
import { watch } from 'vue'
import ControlChip from '@/components/wms/ControlChip.vue'

interface Props {
  layerTitle?: string
  isLoading: boolean
  currentTime?: Date
  forecastTime?: Date
  completelyMissing?: boolean
  firstValueTime?: Date
  lastValueTime?: Date
  canUseStreamlines?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layerTitle: '',
  completelyMissing: false,
})

const emit = defineEmits(['style-click', 'update:layerKind'])

const showLayer = defineModel<boolean>('showLayer')
const animate = defineModel<boolean>('animate', { default: false })

const analysisTime = computed(() => {
  if (!props.forecastTime) return undefined

  if (isNaN(props.forecastTime.getTime())) {
    return 'Analysis time not available'
  }

  return (
    'Analysis time: ' +
    DateTime.fromJSDate(props.forecastTime).toFormat('dd/MM/yyyy, HH:mm:ss')
  )
})

const formattedTimeRange = computed(() => {
  if (!props.firstValueTime || !props.lastValueTime) return ''
  const format = 'dd/MM/yyyy, HH:mm:ss'
  return `${DateTime.fromJSDate(props.firstValueTime).toFormat(
    format,
  )} → ${DateTime.fromJSDate(props.lastValueTime).toFormat(format)}`
})

const switchLayerType = () => {
  animate.value = !animate.value
}

watch(
  () => animate.value,
  () => {
    const value = animate.value ? LayerKind.Streamline : LayerKind.Static
    emit('update:layerKind', value)
  },
)
</script>

<style scoped>
#toggle {
  display: flex;
  justify-content: center;
}

:deep(.information-panel-list > .v-list-item > .v-list-item__prepend) {
  align-self: start;
  transform: translateY(8px);
}
</style>
