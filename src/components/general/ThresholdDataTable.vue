<template>
  <div class="table-container pb-1">
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
import { toDateAbsDifferenceString } from '@/lib/date'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

interface Row {
  header: string
  value: string | undefined | null
}

interface Props {
  crossing: LevelThresholdCrossings
}

const props = defineProps<Props>()

const NOW_REFRESH_INTERVAL = 1000
const now = useNow({ interval: NOW_REFRESH_INTERVAL })

const timeToMaxString = computed(() =>
  toDateAbsDifferenceString(now.value, props.crossing.maxValueTime, {
    excludeSeconds: true,
  }),
)

const isMaxValueInFuture = computed(() => {
  const diff =
    new Date(props.crossing.maxValueTime ?? '').getTime() - now.value.getTime()
  return diff > 0
})

const tableData = computed<Row[]>(() => {
  return [
    {
      header: 'Warning level:',
      value: props.crossing.warningLevelName,
    },
    {
      header: 'Max value:',
      value: isMaxValueInFuture.value
        ? `in ${timeToMaxString.value}`
        : `${timeToMaxString.value} ago`,
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
}

.data-table td {
  padding-bottom: 2px;
  line-height: 1;
  font-size: 0.875rem;
}
</style>
