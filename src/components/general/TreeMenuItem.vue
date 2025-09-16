<template>
  <template v-for="item in props.items" :key="item.id">
    <template v-if="item.children?.length">
      <v-list-group :value="item.id" class="tree-menu--list-group">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <ColumnItemIcon :item="item" />
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template v-slot:append="{ isActive }">
              <v-icon v-if="item.appendIcon">
                {{ item.appendIcon }}
              </v-icon>
              <v-icon>
                {{ isActive ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
            </template>
          </v-list-item>
        </template>
        <TreeMenuItem
          :items="item.children"
          :active="props.active"
        ></TreeMenuItem>
        <v-divider
          v-if="item.children.some((c) => c.children?.length)"
          class="mx-2"
        ></v-divider>
      </v-list-group>
    </template>
    <v-list-item
      v-else-if="item.href"
      :href="item.href"
      target="_blank"
      class="tree-menu--list-item"
    >
      <template v-slot:prepend>
        <ColumnItemIcon :item="item" leaf />
      </template>
      <v-list-item-title>{{ item.name }}</v-list-item-title>
      <template v-slot:append>
        <v-icon size="xsmall">mdi-open-in-new</v-icon>
      </template>
    </v-list-item>
    <template v-else>
      <v-list-item
        :to="item.to"
        :active="props.active === item.id"
        density="compact"
        class="tree-menu--list-item"
      >
        <template v-slot:prepend>
          <ColumnItemIcon :item="item" leaf />
        </template>
        <v-list-item-title>{{ item.name }}</v-list-item-title>
        <template v-slot:append>
          <v-icon v-if="item.appendIcon" size="xsmall">{{
            item.appendIcon
          }}</v-icon>
        </template>
      </v-list-item>
    </template>
  </template>
</template>

<script setup lang="ts">
import ColumnItemIcon from '@/components/general/ColumnItemIcon.vue'
import type { ColumnItem } from './ColumnItem.js'

interface Props {
  items?: ColumnItem[]
  active?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return []
  },
  active: '',
})
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

.tree-menu--list-group :deep(.v-list-group__items .v-list-item) {
  transition-duration: 0.2s;
  transition-property: padding-inline-start;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-list-item__spacer) {
  width: 12px !important;
}

.alert-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: rgba(
    var(--v-theme-surface),
    var(--v-high-emphasis-opacity)
  );
  border-radius: 50%;
}
</style>

<style>
.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .tree-menu--list-group {
  --prepend-width: 0;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .tree-menu--list-group
  .v-list-group__items {
  --indent-padding: 0px;
  --prepend-width: 0px;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .v-list-item__content {
  display: none;
}

.tree-menu--list-group {
  --prepend-width: 0px;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .tree-menu--list-group
  > .tree-menu--list-group
  .v-list-group__items
  .v-list-group {
  --prepend-width: 0px;
}
</style>
