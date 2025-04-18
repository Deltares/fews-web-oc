<template>
  <BaseTaskFilterControl
    v-model="selectedTaskStatuses"
    :items="taskStatusOptions"
    label="Status"
    @update:model-value="updateSelectedCategories"
  >
    <template #actions>
      <v-btn-toggle
        v-model="selectedCategories"
        multiple
        density="compact"
        variant="outlined"
        class="ma-2"
      >
        <v-btn
          v-for="category in getAllTaskStatusCategories()"
          :key="category"
          :value="category"
          @click="updateSelectedTaskStatus"
        >
          {{ getTaskStatusCategoryName(category) }}
        </v-btn>
      </v-btn-toggle>
    </template>
  </BaseTaskFilterControl>
</template>
<script setup lang="ts">
import { ref } from 'vue'

import {
  getAllTaskStatusCategories,
  getCompleteTaskStatusCategories,
  getTaskStatusesForCategories,
  getTaskStatusCategoryName,
  TaskStatus,
  TaskStatusCategory,
} from '@/lib/taskruns'

import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'

const selectedTaskStatuses = defineModel<TaskStatus[]>({ required: true })
const selectedCategories = ref<TaskStatusCategory[]>([])

interface TaskStatusItem {
  id: string
  title: string
  value: TaskStatus
}
const taskStatusOptions: TaskStatusItem[] = Object.values(TaskStatus).map(
  (value) => {
    // Capitalise the first letter of the value to get a human-readable title.
    const title = value[0].toUpperCase() + value.slice(1)
    return {
      id: value,
      title,
      value,
    }
  },
)
// Initialise the group selections based on the initially selected task
// statuses.
updateSelectedCategories(selectedTaskStatuses.value)

// Update the selected task status groups when the user selects or deselects
// individual statuses.
function updateSelectedCategories(newStatuses: TaskStatus[]): void {
  if (newStatuses.length === taskStatusOptions.length) {
    selectedCategories.value = []
  } else {
    selectedCategories.value = getCompleteTaskStatusCategories(newStatuses)
  }
}

function updateSelectedTaskStatus(): void {
  if (selectedCategories.value.length === 0) {
    selectedTaskStatuses.value = Object.values(TaskStatus)
    return
  }

  selectedTaskStatuses.value = getTaskStatusesForCategories(
    selectedCategories.value,
  )
}
</script>
