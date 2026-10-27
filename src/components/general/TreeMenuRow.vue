<template>
  <v-divider v-if="showDivider" class="mx-2"></v-divider>
  <v-list-item
    v-else-if="item.children?.length"
    :style="indent"
    density="comfortable"
    @click="emit('toggle')"
  >
    <template #prepend>
      <ColumnItemIcon :item="item" />
    </template>
    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <template #append>
      <v-icon v-if="item.appendIcon">{{ item.appendIcon }}</v-icon>
      <v-icon>{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </template>
  </v-list-item>
  <v-list-item
    v-else-if="item.href"
    :href="item.href"
    target="_blank"
    :style="indent"
    class="tree-menu--list-item"
  >
    <template #prepend>
      <ColumnItemIcon :item="item" leaf />
    </template>
    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <template #append>
      <v-icon size="xsmall">mdi-open-in-new</v-icon>
    </template>
  </v-list-item>
  <v-list-item
    v-else
    :to="item.to"
    :active="active === item.id"
    :style="indent"
    density="compact"
    class="tree-menu--list-item"
  >
    <template #prepend>
      <ColumnItemIcon :item="item" leaf />
    </template>
    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <template #append>
      <v-icon v-if="item.appendIcon" size="xsmall">{{
        item.appendIcon
      }}</v-icon>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ColumnItemIcon from '@/components/general/ColumnItemIcon.vue'
import type { ColumnItem } from './ColumnItem.js'

interface Props {
  item: ColumnItem
  depth: number
  active?: string
  open?: boolean
  showDivider?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  active: '',
  open: false,
  showDivider: false,
})

const emit = defineEmits<{ toggle: [] }>()

const indent = computed(() => ({
  paddingInlineStart: `${16 + props.depth * 16}px`,
}))
</script>

<style scoped>
.tree-menu--list-item {
  margin-left: 2px;
  border-left: 2px solid rgb(var(--v-border-color));
}

/* To counter act being moved by the above border */
.tree-menu--list-item > :deep(.v-list-item__prepend) {
  margin-left: -4px;
}

:deep(.v-list-item__spacer) {
  width: 12px !important;
}
</style>

<style>
.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .weboc-treemenu
  .v-list-item__content {
  display: none;
}
</style>
