<template>
  <div class="table-container">
    <table class="data-table">
      <thead></thead>
      <tbody>
        <tr v-for="row in tableData">
          <td class="text-high-emphasis">
            {{ row.header }}
            <span class="text-medium-emphasis">
              {{ row.value }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { toDateRelativeString } from '@/lib/date';
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useIntervalFn } from '@vueuse/core';
import { computed, ref, watchEffect } from 'vue';

interface Row {
  header: string
  value: string | undefined | null
}

interface Props {
  crossing: LevelThresholdCrossings
}

const props = defineProps<Props>()

const NOW_REFRESH_INTERVAL = 1000
const timeToMaxString = ref(toDateRelativeString(props.crossing.maxValueTime))
useIntervalFn(updateTimeToMaxString, NOW_REFRESH_INTERVAL)

watchEffect(updateTimeToMaxString)
function updateTimeToMaxString() {
  timeToMaxString.value = toDateRelativeString(props.crossing.maxValueTime)
}

const tableData = computed<Row[]>(() => {
  return [
    {
      header: 'Warning level:',
      value: props.crossing.warningLevelName,
    },
    {
      header: 'Max value reached:',
      value: timeToMaxString.value,
    },
    {
      header: 'Parameter:',
      value: props.crossing.parameterId,
    },
  ]
})
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.data-table {
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  text-align: left;
  padding-right: 1.5px;
}

.data-table td {
  padding-bottom: 1px;
  line-height: 0.9rem;
  font-size: 0.75em;
}
</style>
