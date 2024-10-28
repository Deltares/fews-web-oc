<template>
  <template v-for="item in props.items" :key="item.id">
    <template v-if="item.children?.length">
      <v-list-group :value="item.id">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-badge
                color="#00BBF0"
                :model-value="(item.thresholdCount ?? 0) > 0"
                :content="item.thresholdCount"
              >
                <v-icon
                  :icon="
                    item.icon ??
                    `mdi-alpha-${item.name.substring(0, 1).toLowerCase()}-circle-outline`
                  "
                ></v-icon>
              </v-badge>
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template v-slot:append="{ isActive }">
              <v-icon v-if="item.icon">
                {{ item.icon }}
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
      </v-list-group>
    </template>
    <v-list-item
      class="tree-menu--list-item"
      v-else
      :to="item.to"
      :href="item.href"
      :target="item.href ? '_blank' : undefined"
      :active="props.active === item.id"
    >
      <template v-slot:prepend>
        <v-badge
          color="#00BBF0"
          :model-value="(item.thresholdCount ?? 0) > 0"
          :content="item.thresholdCount"
        >
          <v-icon
            >{{
              item.icon ??
              `mdi-alpha-${item.name.substring(0, 1).toLowerCase()}-circle-outline`
            }}
          </v-icon>
        </v-badge>
      </template>
      <v-list-item-title>{{ item.name }}</v-list-item-title>
      <template v-slot:append>
        <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
      </template>
    </v-list-item>
  </template>
</template>

<script setup lang="ts">
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

:deep(.v-list-group) {
  --prepend-width: 0;
}

:deep(.v-list-group__items) {
  --indent-padding: 0px;
  --prepend-width: 0px;
}

:deep(.v-list-group > .v-list-group__items .v-list-group) {
  --prepend-width: 0px;
}
</style>
