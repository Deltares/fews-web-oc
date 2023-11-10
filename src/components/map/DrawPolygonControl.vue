<template>
  <div ref="root"></div>
</template>

<script lang="ts">
/**
 * All Draw events which will be mapped/bounded to the component
 * @see https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#events
 * @type {Array}
 */
const mapEvents: MapboxDraw.DrawEventType[] = [
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
import { computed, ref, unref, onBeforeUnmount, onMounted, watch } from 'vue'

const root = ref<HTMLElement>()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {
      return {}
    },
  },
  ...propsConfig,
})

const { map } = useMap()
const emit = defineEmits([...mapEvents, 'update:modelValue'])

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
  mapEvents,
  props: unref(options),
  emit,
})

onMounted(() => {
  if (control.value) control.value.add(props.modelValue)
  map.value.on('draw.create', (event: any) => {
    if (event.features.length > 0) {
      emit('update:modelValue', event.features)
    }
  })
  map.value.on('draw.update', (event: any) => {
    if (event.features.length > 0) {
      emit('update:modelValue', event.features)
    }
  })
})

onBeforeUnmount(() => {
  deleteAll()
})

watch(
  props.modelValue,
  () => {
    if (props.modelValue && control.value) {
      control.value.deleteAll().add(props.modelValue)
    }
  },
  { immediate: true },
)


const deleteAll = () => {
  if (control.value) {
    control.value.deleteAll()
  }
}



defineExpose({ control, deleteAll })
</script>
