<template>
  <template v-for="item in props.items" :key="item.id">
    <template v-if="item.children?.length">
      <v-list-group :value="item.id">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
        </template>
        <TreeMenuItem
          :items="item.children"
          :active="props.active"
        ></TreeMenuItem>
      </v-list-group>
    </template>
    <v-list-item
      v-else-if="item.href"
      :href="item.href"
      target="_blank"
      :active="props.active === item.id"
    >
      <v-list-item-title>{{ item.name }}</v-list-item-title>
      <template v-slot:append>
        <v-icon size="xsmall">{{ item.icon }}</v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-else
      :to="item.to"
      :active="props.active === item.id"
      style="margin-right: 10px"
    >
      <v-list-item-title>{{ item.name }}</v-list-item-title>
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
