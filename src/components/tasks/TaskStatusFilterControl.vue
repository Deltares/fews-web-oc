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
          @click="toggleStatusCategory(category)"
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
  getTaskStatusesForCategory,
  getTaskStatusCategoryName,
  TaskStatus,
  TaskStatusCategory,
} from '@/lib/taskruns'

import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'

const selectedTaskStatuses = defineModel<TaskStatus[]>({ required: true })
const selectedCategories = ref<TaskStatusCategory[]>([])
// Initialise the group selections based on the initially selected task
// statuses.
updateSelectedCategories(selectedTaskStatuses.value)

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

// Update the selected task status groups when the user selects or deselects
// individual statuses.
function updateSelectedCategories(newStatuses: TaskStatus[]): void {
  selectedCategories.value = getCompleteTaskStatusCategories(newStatuses)
}

function toggleStatusCategory(category: TaskStatusCategory): void {
  const isCurrentlySelected = selectedCategories.value.includes(category)

  // This function is triggered _after_ the model value has been updated, so if
  // we no longer have this category in the selected category, remove the
  // associated statuses.
  const doRemove = !isCurrentlySelected

  const categoryStatuses = getTaskStatusesForCategory(category)
  if (doRemove) {
    // Remove statuses for this group from the current selection.
    selectedTaskStatuses.value = selectedTaskStatuses.value.filter(
      (status) => !categoryStatuses.includes(status),
    )
  } else {
    // Add statuses for this group to the current selection.
    selectedTaskStatuses.value = [
      ...selectedTaskStatuses.value,
      ...categoryStatuses,
    ]
  }
}
</script>
