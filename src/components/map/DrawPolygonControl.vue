<template>
  <div ref="root"></div>
</template>

<script lang="ts">
/**
 * All Draw events which will be mapped/bounded to the component
 * @see https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#events
 * @type {Array}
 */
const events: MapboxDraw.DrawEventType[] = [
  'draw.create',
  'draw.delete',
  'draw.combine',
  'draw.uncombine',
  'draw.update',
  'draw.selectionchange',
  'draw.modechange',
]

/**
 * All Draw options which will be props of the component
 * @see https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#options
 */
const propsConfig = {
  displayControlsDefault: {
    type: Boolean,
    default: true,
  },
  keybindings: {
    type: Boolean,
    default: true,
  },
  touchEnabled: {
    type: Boolean,
    default: true,
  },
  boxSelect: {
    type: Boolean,
    default: true,
  },
  clickBuffer: {
    type: Number,
    default: 2,
  },
  touchBuffer: {
    type: Number,
    default: 25,
  },
  controls: {
    type: Object,
    default: () => {
      return {}
    },
  },
  defaultMode: {
    type: String,
    default: 'simple_select',
  },
  userProperties: {
    type: Boolean,
    default: false,
  },
}
</script>

<script setup lang="ts">
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import DrawRectangle from '@/lib/mapbox/DrawRectangleMode.js'
import { useControl, useMap } from '@studiometa/vue-mapbox-gl'
import customStyles from '@/assets/mapbox-draw-polygon-styles.json'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { computed, ref, unref, onMounted } from 'vue'

const root = ref<HTMLElement>()

const props = defineProps(propsConfig)

const { map } = useMap()
const emit = defineEmits(events)

const options = computed(() => {
  const opts = {
    modes: Object.assign(MapboxDraw.modes, { draw_rectangle: DrawRectangle }),
    styles: customStyles,
    ...props,
  }
  return opts
})

const { control } = useControl(MapboxDraw, {
  propsConfig,
  events,
  props: unref(options),
  emit,
})

onMounted(() => {
  map.value.on('draw.modechange', (event: any) => {
    if (event.mode === 'draw_polygon') {
      control.value.changeMode('draw_rectangle')
    }
  })
})

defineExpose({ control })
</script>
