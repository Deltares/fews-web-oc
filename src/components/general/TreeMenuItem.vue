<template>
  <template v-for="item in props.items" :key="item.id">
    <template v-if="item.children?.length">
      <v-list-group :value="item.id">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template v-slot:append="{ isActive }">
              <v-icon v-if="item.icon">
                {{ item.icon }}
              </v-icon>
              <ThresholdInformation
                :icon="item.thresholdIcon"
                :count="item.thresholdCount"
              />
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
      v-else
      :to="item.to"
      :href="item.href"
      :target="item.href ? '_blank' : undefined"
      :active="props.active === item.id"
    >
      <v-list-item-title>{{ item.name }}</v-list-item-title>
      <template v-slot:append>
        <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
        <ThresholdInformation
          :icon="item.thresholdIcon"
          :count="item.thresholdCount"
        />
      </template>
    </v-list-item>
  </template>
</template>

<script setup lang="ts">
import type { ColumnItem } from './ColumnItem.js'
import ThresholdInformation from '@/components/general/ThresholdInformation.vue'

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
