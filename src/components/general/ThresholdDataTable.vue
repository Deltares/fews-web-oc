<template>
  <div class="table-container py-1 border-t">
    <v-list-item class="pa-1 ps-2 w-100">
      <template #prepend>
        <v-img width="25px" :src="crossing.icon" class="pe-1"></v-img>
      </template>
      <div class="d-flex w-100 justify-space-between align-center">
        <div>
          <v-list-item-title class="ps-1">
            <div>
              {{ crossing.parameterId }}
            </div>
          </v-list-item-title>
        </div>
        <div>
          <v-list-item-title class="ps-1 text-end">
            <div>
              {{ crossing.maxValue }}
            </div>
          </v-list-item-title>
          <v-list-item-subtitle class="ps-1 text-end">
            {{ timeToMaxString }}
          </v-list-item-subtitle>
        </div>
      </div>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { toDateAbsDifferenceString } from '@/lib/date'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

interface Props {
  crossing: Omit<LevelThresholdCrossings, 'locationId'>
}

const props = defineProps<Props>()

const NOW_REFRESH_INTERVAL = 1000
const now = useNow({ interval: NOW_REFRESH_INTERVAL })

const timeToMaxString = computed(() =>
  toDateAbsDifferenceString(now.value, props.crossing.maxValueTime, {
    excludeSeconds: true,
    relativeFormat: true,
  }),
)
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
</style>
