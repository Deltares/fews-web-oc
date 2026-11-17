<template>
  <component :is="tag" class="resource-icon">
    <img :src="src" alt="" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JSXComponent } from 'vuetify'
import { getResourcesIconsUrl } from '@/lib/fews-config'

interface Props {
  icon?: string
  tag: string | JSXComponent
}
const props = defineProps<Props>()

const src = computed(() =>
  props.icon ? getResourcesIconsUrl(props.icon) : undefined,
)
</script>

<style scoped>
/* Images should not be dimmed like font icons (e.g. in list items), but
   :where() keeps the specificity low so components can still override it. */
:where(.resource-icon) {
  opacity: 1;
}

.resource-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
