<template>
  <v-layout class="settings-container">
    <h1>Settings</h1>
    <div v-for="group in groups" :key="group">
      <v-card density="compact">
        <v-card-title>{{ group }}</v-card-title>
        <v-list>
          <v-list-item
            v-for="(setting, index) in store.listByGroup(group)"
            :key="index"
            :disabled="setting?.disabled"
          >
            <template v-slot:append>
              <v-btn
                color="grey-lighten-1"
                icon="mdi-information"
                variant="text"
              >
                <v-icon @click="onFavoriteChange(setting)">{{
                  setting.favorite ? 'mdi-star' : 'mdi-star-outline'
                }}</v-icon>
              </v-btn>
            </template>
            <v-select
              v-if="setting.type === 'oneOfMultiple'"
              :label="setting.label"
              v-model="setting.value"
              :items="setting.items"
              :disabled="setting.disabled"
              variant="solo"
              density="compact"
              item-title="value"
              item-value="value"
              item-disabled="disabled"
              @update:modelValue="onValueChange(setting)"
            >
            </v-select>
            <v-switch
              v-else-if="setting.type === 'boolean'"
              :label="setting.label"
              v-model="setting.value"
              color="primary"
              :disabled="setting.disabled"
              @change="onValueChange(setting)"
            >
            </v-switch>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </v-layout>
</template>

<script setup>
import { useUserSettingsStore } from '../stores/userSettings' // Import your Pinia store
import { computed } from 'vue'

const store = useUserSettingsStore()
const groups = computed(() => store.listGroups)

const onValueChange = (item) => {
  store.add(item)
}

const onFavoriteChange = (item) => {
  item.favorite = !item.favorite
  onValueChange(item)
}

// const getComponentType = (item) => {
//   // Determine the component type based on item.type
//   console.log(item)
//   if (item === undefined) return
//   if (item.type === 'oneOfMultiple') {
//     return 'v-select-component'; // Replace with your custom v-select component
//   } else if (item.type === 'boolean') {
//     return 'v-switch-component'; // Replace with your custom v-switch component
//   }
// }
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  row-gap: 20px;
  justify-content: space-between;
}

/* Add your component-specific styles here */
</style>
