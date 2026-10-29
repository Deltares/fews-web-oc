<template>
  <svg
    :viewBox="`0 0 ${qr.size} ${qr.size}`"
    :width="size"
    :height="size"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="`QR code for ${value}`"
  >
    <rect :width="qr.size" :height="qr.size" :fill="dark ? 'black' : 'white'" />
    <path :d="path" :fill="dark ? 'white' : 'black'" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { encode } from 'uqr'

interface Props {
  value: string
  size?: number
  dark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 128,
  dark: false,
})

// The QR specification asks for a 4 module quiet zone; a 2 module border is
// enough for scanners when the surrounding background is plain
const qr = computed(() => encode(props.value, { ecc: 'M', border: 2 }))

const path = computed(() =>
  qr.value.data
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : '')),
    )
    .join(''),
)
</script>
