<template>
  <v-list-item prepend-icon="mdi-clock-end">
    <div>Show accumulated data</div>
    <template v-slot:append>
      <v-switch
        v-model="active"
        color="primary"
        density="compact"
        hide-details
      ></v-switch>
    </template>
  </v-list-item>
  <v-list-item v-if="active">
    <template v-slot:prepend>
      <v-icon></v-icon>
    </template>
    <v-list-item-action>
      <v-btn-toggle
        v-model="modelValue"
        density="compact"
        variant="outlined"
        divided
      >
        <v-tooltip
          v-for="item in items"
          :key="item.id"
          :text="`${item.type} ${item.id}`"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :value="item.id"
              class="tab text-none px-1"
              size="small"
              :text="item.shortLabel"
              :icon="item.icon"
              min-width="35px"
            >
            </v-btn>
          </template>
        </v-tooltip>
      </v-btn-toggle>
    </v-list-item-action>
  </v-list-item>
</template>

<script setup lang="ts">
interface Props {
  items: {
    id: string
    type: string
    label: string
    shortLabel: string
    icon?: string
  }[]
}
const props = defineProps<Props>()

const modelValue = defineModel<string | null>('modelValue', { required: true })
const active = defineModel<boolean>('active', { required: true })
</script>
