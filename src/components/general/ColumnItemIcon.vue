<template>
  <div class="icon-container">
    <v-badge
      color="#00BBF0"
      :model-value="(item.thresholdCount ?? 0) > 0"
      :content="item.thresholdCount"
    >
      <v-icon :icon="icon"></v-icon>
    </v-badge>
  </div>
</template>

<script setup lang="ts">
import { toCharacterIcon } from '@/lib/icons'
import type { ColumnItem } from '@/components/general/ColumnItem'
import { computed } from 'vue'

interface Props {
  item: ColumnItem
  leaf?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  leaf: false,
})

const icon = computed(
  () =>
    props.item.icon ??
    toCharacterIcon(
      props.item.name,
      props.leaf ? undefined : '-circle-outline',
    ),
)
</script>

<style scoped>
.icon-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
